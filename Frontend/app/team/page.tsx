import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function Team() {
  const teamMembers = [
    {
      name: "Krish Birenkumar Modi",
      initial: "K",
      role: "Team Leader",
      description: "VGEC, Ahmedabad | IT Department | Batch 2027",
      achievements: "NASA Space Apps Challenge Winner & Global Nominee",
      position: "President, TCF – VGEC",
    },
    {
      name: "Harsh Jitendrakumar Nakum",
      initial: "H",
      role: "Team Member",
      description: "5th Semester, Information Technology",
      institute: "Vishwakarma Government Engineering College (VGEC)",
    },
    {
      name: "Umang Bharat Anam",
      initial: "U",
      role: "Team Member",
      description: "5th Semester, Information Technology",
      institute: "Vishwakarma Government Engineering College (VGEC)",
    },
    {
      name: "Meet Rasikbhai Kotadiya",
      initial: "M",
      role: "Team Member",
      description: "5th Semester, Information Technology",
      institute: "Vishwakarma Government Engineering College (VGEC)",
    },
    {
      name: "Sakshi Sanjaykumar Doshi",
      initial: "S",
      role: "Team Member",
      description: "5th Semester, Information Technology",
      institute: "Vishwakarma Government Engineering College (VGEC)",
    },
    {
      name: "Roshni Vinodkumar Raichandani",
      initial: "R",
      role: "Team Member",
      description: "5th Semester, Information Technology",
      institute: "Vishwakarma Government Engineering College (VGEC)",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto max-w-7xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Our Team</h1>
          <p className="text-lg text-gray-600">
            5th Semester Design Engineering Project | Information Technology Department
          </p>
          <p className="text-md text-gray-500 mt-2">
            Vishwakarma Government Engineering College, Ahmedabad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex flex-col items-center">
                {/* Circular Avatar with Initial */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {member.initial}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                  {member.name}
                </h2>
                
                <p className="text-sm font-semibold text-blue-600 mb-3">
                  {member.role}
                </p>
                
                <div className="text-center text-sm text-gray-600 space-y-1">
                  <p>{member.description}</p>
                  {member.institute && <p className="text-gray-500">{member.institute}</p>}
                  {member.achievements && (
                    <p className="text-blue-700 font-medium mt-2">{member.achievements}</p>
                  )}
                  {member.position && (
                    <p className="text-indigo-600 font-medium">{member.position}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">Academic Year 2024-25 | Batch 2027</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
