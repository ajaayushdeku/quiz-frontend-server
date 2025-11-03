import React from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Users, HelpCircle } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-6 text-black">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Manage Quiz Masters */}
        <div
          className="p-8 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center border-2 border-gray-300 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("manage-quizmasters")}
        >
          <Users className="w-12 h-12 mb-4 text-blue-600" />
          <h2 className="text-2xl font-semibold text-center text-black">
            Manage Quiz Masters
          </h2>
          <p className="text-gray-600 mt-2 text-center">
            Add or remove quiz masters and manage permissions.
          </p>
        </div>

        {/* Manage Questions */}
        <div
          className="p-8 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center border-2 border-gray-300 hover:scale-105 transition-transform cursor-pointer"
          onClick={() => navigate("manage-questions")}
        >
          <HelpCircle className="w-12 h-12 mb-4 text-blue-600" />
          <h2 className="text-2xl font-semibold text-center text-black">
            Manage Questions
          </h2>
          <p className="text-gray-600 mt-2 text-center">
            View, add, and edit questions in the quiz database.
          </p>
        </div>
      </div>

      {/* Nested route content */}
      <div className="w-full mt-10">
        <Outlet />
      </div>
    </div>
  );
}
