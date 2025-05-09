"use client";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "../../../components/ThemeToggle";

function MainComponent() {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!email || !password) {
            setError(
                <span className="text-text-light dark:text-text-dark">
                    Please fill in all fields
                </span>
            );
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            console.log('Login response:', data); // Debug log
            if (!res.ok) throw new Error(data.error || 'Login failed');
            localStorage.setItem('token', data.token);
            console.log('Token saved:', localStorage.getItem('token')); // Debug log
            // Redirect based on user role
        if (data.user.role === 'admin') {
            window.location.href = '/AdminDashboard';
        } else if (data.user.role === 'cafe') {
            window.location.href = '/CafeDashboard';
        } else {
            window.location.href = '/';
        }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        setError("Google sign-in not implemented yet");
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
        setTimeout(() => setPasswordVisible(false), 15000);
    };

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-8 font-ibm-plex-sans">
                        Hello Reader!
                    </h1>

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Username or Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-6 py-3 rounded-full border border-border-light dark:border-border-dark focus:border-primary-light dark:focus:border-primary-dark focus:ring-1 focus:ring-primary-light dark:focus:ring-primary-dark transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-3 rounded-full border border-border-light dark:border-border-dark focus:border-primary-light dark:focus:border-primary-dark focus:ring-1 focus:ring-primary-light dark:focus:ring-primary-dark transition-colors"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400"
                            >
                                {passwordVisible ? "🙈" : "👁️"}
                            </button>
                        </div>

                        {error && (
                            <div className="bg-warning-light dark:bg-warning-dark text-warning-light dark:text-warning-dark p-4 rounded-full text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-light dark:bg-primary-dark text-white dark:text-black px-6 py-3 rounded-full hover:bg-primary-light dark:hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Log In"}
                        </button>
                    </form>

                    <div className="my-8 flex items-center">
                        <div className="flex-1 border-t border-border-light dark:border-border-dark"></div>
                        <span className="px-4 text-gray-500 dark:text-gray-400 text-sm">Or</span>
                        <div className="flex-1 border-t border-border-light dark:border-border-dark"></div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full border border-border-light dark:border-border-dark px-6 py-3 rounded-full flex items-center justify-center space-x-2 hover:bg-backgroundSCD-light dark:hover:bg-backgroundSCD-dark transition-colors"
                        >
                            <i className="fab fa-google text-xl"></i>
                            <span className="text-text-light dark:text-text-dark">Continue with Google</span>
                        </button>

                        <button className="w-full border border-border-light dark:border-border-dark px-6 py-3 rounded-full flex items-center justify-center space-x-2 hover:bg-backgroundSCD-light dark:hover:bg-backgroundSCD-dark transition-colors">
                            <i className="fab fa-apple text-xl"></i>
                            <span className="text-text-light dark:text-text-dark">Continue with Apple</span>
                        </button>
                    </div>

                    <p className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                        New here?{" "}
                        <Link href="/auth/signup" className="text-text-light dark:text-text-dark hover:underline">
                            Sign up instead
                        </Link>
                    </p>
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-backgroundSCD-light to-backgroundSCD-light dark:from-backgroundSCD-dark dark:to-backgroundSCD-dark p-12">
                <div className="relative">
                    <img
                        src="/Graphic 1.png"
                        alt="Person reading a book with floating elements"
                        className="w-full max-w-lg"
                    />
                </div>
            </div>

            <ThemeToggle />
        </div>
    );
}

export default MainComponent;