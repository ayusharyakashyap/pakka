"use client";
import { useEffect } from "react";
import { getSrc, syncTeamFlag, track } from "@/lib/client";

export default function Track() {
  useEffect(() => {
    syncTeamFlag();
    const src = getSrc();
    track("visit", src ? { src } : {});
  }, []);
  return null;
}
