import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, User as UserIcon, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      // User not authenticated
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleLogin = async () => {
    try {
      await User.login();
      // After login, check auth status again
      setTimeout(checkAuthStatus, 1000);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="glassmorphism rounded-lg px-4 py-2">
        <div className="w-16 h-6 bg-white/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button
        onClick={handleLogin}
        className="glassmorphism border-white/30 text-primary hover:glow"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 glassmorphism rounded-lg px-4 py-2 hover:glow transition-all duration-200">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-primary truncate max-w-32">
              {user.full_name || user.email}
            </p>
            <p className="text-xs text-secondary">
              {user.role === 'admin' ? 'Admin' : 'User'}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glassmorphism border-white/30" align="end">
        <DropdownMenuItem asChild className="text-primary hover:bg-white/10 focus:bg-white/10 focus:text-primary cursor-pointer">
          <Link to={createPageUrl("Settings")} className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-primary hover:bg-white/10 focus:bg-white/10 focus:text-primary cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}