"use client";

import { Component, type ReactNode } from "react";

/** Inside the canvas: if a body's texture fails to load, show `fallback` (the plain sphere) instead of failing the scene. */
export class TextureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
