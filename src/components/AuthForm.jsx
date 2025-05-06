import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-white p-lg rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-lg text-center">
        {isLogin ? "Login" : "Sign Up"}
      </h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-lg">
        <div>
          <label className="block text-gray-700 mb-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-sm border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-sm border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-pri-blue-500 text-white py-sm rounded hover:bg-pri-blue-600 transition-colors"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="w-full mt-lg text-pri-blue-500 hover:text-pri-blue-600"
      >
        {isLogin
          ? "Need an account? Sign Up"
          : "Already have an account? Login"}
      </button>
    </div>
  );
}

export default AuthForm;
