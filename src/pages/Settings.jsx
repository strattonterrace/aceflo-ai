import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Settings as SettingsIcon, 
  Zap, 
  Target, 
  Settings2, 
  Sparkles, 
  Save, 
  Check, 
  HelpCircle, 
  RefreshCw,
  Bell,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [modeOverride, setModeOverride] = useState("auto");
  const [notifyChannel, setNotifyChannel] = useState("email");
  const [notifyFrequency, setNotifyFrequency] = useState("daily");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRestartingTour, setIsRestartingTour] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setModeOverride(currentUser.mode_override || "auto");
      setNotifyChannel(currentUser.notify_channel || "email");
      setNotifyFrequency(currentUser.notify_frequency || "daily");
      setPhoneNumber(currentUser.phone_number || "");
    } catch (error) {
      console.error("Error loading user settings:", error);
    }
    setIsLoading(false);
  };

  const saveModePreference = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await User.updateMyUserData({ mode_override: modeOverride });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving mode preference:", error);
    }
    setIsSaving(false);
  };

  const saveNotificationPreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updates = {
        notify_channel: notifyChannel,
        notify_frequency: notifyFrequency
      };
      
      // Only include phone number if SMS is enabled and frequency is not off
      if ((notifyChannel === "sms" || notifyChannel === "both") && notifyFrequency !== "off") {
        updates.phone_number = phoneNumber;
      } else {
        // If SMS is not enabled or notifications are off, clear the phone number
        updates.phone_number = null; 
      }
      
      await User.updateMyUserData(updates);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
    }
    setIsSaving(false);
  };

  const handleRestartTour = async () => {
    if (!user) return;
    
    setIsRestartingTour(true);
    try {
      await User.updateMyUserData({ has_completed_tour: false });
      // Reload the page to trigger the tour
      window.location.reload();
    } catch (error) {
      console.error("Error restarting tour:", error);
      setIsRestartingTour(false);
    }
  };

  const modeOptions = [
    {
      id: "auto",
      label: "Auto",
      icon: Sparkles,
      description: "ACE.IO automatically chooses the best mode based on your message",
      color: "text-purple-400"
    },
    {
      id: "coach",
      label: "Coach",
      icon: Target,
      description: "Navigate & reframe - steady, grounded, human coaching",
      color: "text-blue-400"
    },
    {
      id: "task",
      label: "Task",
      icon: Settings2,
      description: "Drop-in ready assets - plans, checklists, technical clarity",
      color: "text-green-400"
    },
    {
      id: "ace",
      label: "ACE",
      icon: Zap,
      description: "Wit & edge - candid, motivational, playful yet focused",
      color: "text-orange-400"
    }
  ];

  if (isLoading) {
    return (
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="glassmorphism rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-white/20 rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="glassmorphism rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 glassmorphism rounded-xl flex items-center justify-center glow">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Settings</h1>
              <p className="text-secondary">Customize your ACE.IO experience</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          {/* User Profile Card */}
          {user?.pulse_summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism rounded-xl p-6 mb-6 border-2 border-purple-400/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-primary">Your Profile</h3>
              </div>
              
              <p className="text-primary mb-4 italic">"{user.pulse_summary}"</p>
              
              {user.tone_preference && (
                <div className="mb-3">
                  <span className="text-sm text-secondary">Preferred Tone: </span>
                  <span className="text-sm text-primary">{user.tone_preference}</span>
                </div>
              )}
              
              {user.motivators && user.motivators.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm text-secondary block mb-1">What Drives You:</span>
                  <div className="flex flex-wrap gap-2">
                    {user.motivators.map((motivator, index) => (
                      <span key={index} className="text-xs px-2 py-1 glassmorphism rounded-full text-secondary">
                        {motivator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {user.blockers && user.blockers.length > 0 && (
                <div>
                  <span className="text-sm text-secondary block mb-1">What Holds You Back:</span>
                  <div className="flex flex-wrap gap-2">
                    {user.blockers.map((blocker, index) => (
                      <span key={index} className="text-xs px-2 py-1 glassmorphism rounded-full text-secondary">
                        {blocker}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.pulse_completed_date && (
                <p className="text-xs text-tertiary mt-4">
                  Pulse completed {format(new Date(user.pulse_completed_date), 'MMM d, yyyy')}
                </p>
              )}
            </motion.div>
          )}

          {/* Default Mode Section */}
          <Card className="glassmorphism border-white/30 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Default Mode
              </CardTitle>
              <p className="text-secondary text-sm">
                Choose how ACE.IO responds to your messages by default. You can always override this in individual conversations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={modeOverride}
                onValueChange={setModeOverride}
                className="space-y-3"
              >
                {modeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.div
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Label
                        htmlFor={option.id}
                        className={`flex items-center space-x-4 p-4 glassmorphism rounded-xl cursor-pointer transition-all duration-200 hover:glow ${
                          modeOverride === option.id ? 'ring-2 ring-white/30 glow' : ''
                        }`}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="border-white/30 text-primary"
                        />
                        <div className={`p-2 glassmorphism rounded-lg ${option.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary">{option.label}</span>
                            {option.id === "auto" && (
                              <span className="text-xs bg-white/20 text-primary px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-secondary mt-1">{option.description}</p>
                        </div>
                      </Label>
                    </motion.div>
                  );
                })}
              </RadioGroup>

              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={saveModePreference}
                  disabled={isSaving}
                  className="glassmorphism border-white/30 text-primary hover:glow"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-400" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="glassmorphism border-white/30 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-primary flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <p className="text-secondary text-sm">
                Stay accountable with gentle reminders. We'll check in based on your rhythm.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Frequency */}
              <div>
                <Label className="text-secondary mb-3 block">Check-in Frequency</Label>
                <div className="space-y-2">
                  {[
                    { value: "daily", label: "Daily", desc: "One gentle nudge every day" },
                    { value: "weekly", label: "Weekly", desc: "Once per week accountability check" },
                    { value: "off", label: "Off", desc: "No automated reminders" }
                  ].map((option) => (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Label
                        htmlFor={`freq-${option.value}`}
                        className={`flex items-center justify-between p-4 glassmorphism rounded-xl cursor-pointer transition-all duration-200 hover:glow ${
                          notifyFrequency === option.value ? 'ring-2 ring-white/30 glow' : ''
                        }`}
                      >
                        <div>
                          <div className="font-medium text-primary">{option.label}</div>
                          <div className="text-sm text-secondary">{option.desc}</div>
                        </div>
                        <Switch
                          id={`freq-${option.value}`}
                          checked={notifyFrequency === option.value}
                          onCheckedChange={() => setNotifyFrequency(option.value)}
                          className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/10"
                        />
                      </Label>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Channel */}
              {notifyFrequency !== "off" && (
                <div>
                  <Label className="text-secondary mb-3 block">Delivery Method</Label>
                  <div className="space-y-2">
                    {[
                      { value: "email", label: "Email", desc: "Delivered to your inbox" },
                      { value: "sms", label: "SMS", desc: "Text message reminders" },
                      { value: "both", label: "Email + SMS", desc: "Double coverage" }
                    ].map((option) => (
                      <motion.div
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Label
                          htmlFor={`channel-${option.value}`}
                          className={`flex items-center justify-between p-4 glassmorphism rounded-xl cursor-pointer transition-all duration-200 hover:glow ${
                            notifyChannel === option.value ? 'ring-2 ring-white/30 glow' : ''
                          }`}
                        >
                          <div>
                            <div className="font-medium text-primary">{option.label}</div>
                            <div className="text-sm text-secondary">{option.desc}</div>
                          </div>
                          <Switch
                            id={`channel-${option.value}`}
                            checked={notifyChannel === option.value}
                            onCheckedChange={() => setNotifyChannel(option.value)}
                            className="data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/10"
                          />
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone Number */}
              {(notifyChannel === "sms" || notifyChannel === "both") && notifyFrequency !== "off" && (
                <div>
                  <Label className="text-secondary">Phone Number</Label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="glassmorphism border-white/30 text-primary placeholder:text-tertiary mt-2"
                  />
                  <p className="text-xs text-tertiary mt-1">
                    Include country code for best delivery
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={saveNotificationPreferences}
                  disabled={isSaving}
                  className="glassmorphism border-white/30 text-primary hover:glow"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-400" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Tour Section */}
          <Card className="glassmorphism border-white/30 mb-6">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Onboarding
              </CardTitle>
              <p className="text-secondary text-sm">
                Need a refresher? Walk through the tour again — we'll meet you where you are.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleRestartTour}
                disabled={isRestartingTour}
                className="glassmorphism border-white/30 text-primary hover:glow"
              >
                {isRestartingTour ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Starting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Tour
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* User Profile Info */}
          <Card className="glassmorphism border-white/30">
            <CardHeader>
              <CardTitle className="text-primary">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-secondary text-sm">Name</Label>
                <p className="text-primary font-medium">{user?.full_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-secondary text-sm">Email</Label>
                <p className="text-primary font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-secondary text-sm">Account Type</Label>
                <p className="text-primary font-medium capitalize">{user?.role}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}