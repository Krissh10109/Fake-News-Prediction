"use client";

import { useEffect, useState, useCallback } from "react";
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LiveFeedResult {
    articles: DocumentData[];
    loading: boolean;
    error: string | null;
    newArticleId: string | null;
}

function normalizeTimestamp(ts: any) {
    if (!ts) return ts;
    if (typeof ts.toDate === "function") return ts;
    if (typeof ts === "string" || typeof ts === "number") {
        return { toDate: () => new Date(ts) };
    }
    return ts;
}

/**
 * Primary hook: real-time Firestore listener on `verifications` collection.
 * Falls back to REST polling if Firestore fails.
 */
export function useLiveFeed(maxArticles = 30): LiveFeedResult {
    const [articles, setArticles] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newArticleId, setNewArticleId] = useState<string | null>(null);
    const [useRest, setUseRest] = useState(false);

    // ---- Firestore real-time path ----
    useEffect(() => {
        if (useRest) return;

        let unsubscribe: (() => void) | undefined;

        try {
            const q = query(
                collection(db, "verifications"),
                orderBy("timestamp", "desc"),
                limit(maxArticles)
            );

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const docs = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            timestamp: normalizeTimestamp(data.timestamp),
                        };
                    });

                    // Detect newly added article
                    if (articles.length > 0 && docs.length > 0 && docs[0].id !== articles[0]?.id) {
                        setNewArticleId(docs[0].id);
                        setTimeout(() => setNewArticleId(null), 3000);
                    }

                    setArticles(docs);
                    setLoading(false);
                    setError(null);
                },
                (err) => {
                    console.warn("Firestore listener failed, falling back to REST:", err.message);
                    setUseRest(true);
                }
            );
        } catch (err: any) {
            console.warn("Firestore init failed, falling back to REST:", err.message);
            setUseRest(true);
        }

        return () => unsubscribe?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxArticles, useRest]);

    // ---- REST polling fallback ----
    const fetchFromRest = useCallback(async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
            const res = await fetch(`${backendUrl}/live-feed?limit=${maxArticles}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const docs = (data.articles || data || []).map((a: any, i: number) => ({
                id: a.id || `rest-${i}`,
                ...a,
                timestamp: normalizeTimestamp(a.timestamp),
            }));

            if (articles.length > 0 && docs.length > 0 && docs[0].id !== articles[0]?.id) {
                setNewArticleId(docs[0].id);
                setTimeout(() => setNewArticleId(null), 3000);
            }

            setArticles(docs);
            setLoading(false);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxArticles]);

    useEffect(() => {
        if (!useRest) return;
        fetchFromRest();
        const interval = setInterval(fetchFromRest, 5000);
        return () => clearInterval(interval);
    }, [useRest, fetchFromRest]);

    return { articles, loading, error, newArticleId };
}
