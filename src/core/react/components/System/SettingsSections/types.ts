import { Superstate } from "makemd-core";
import React from "react";

export interface SettingsProps {
  superstate: Superstate;
}

export interface SettingSection {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<{ superstate: Superstate }>;
  category?: string;
}