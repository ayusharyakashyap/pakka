"use client";
import { useEffect } from "react";
import { getSrc, track } from "@/lib/client";

export default function Track() {
  useEffect(() => {
    const src = getSrc();
    track("visit", src ? { src } : {});
  }, []);
  return null;
}
