"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NasaDeepDive } from "../NasaDeepDive";
import { BobCaseFile } from "../BobCaseFile";
import { DEEP_IDS, isDeepId as isDeep, type DeepId as Deep } from "@/content/cards";
import { ExperienceCard, MeCard } from "./InfoCard";

const OPENERS = DEEP_IDS.map((id) => `a[href="#${id}"]`).join(", ");

/**
 * Opens a card when the address ends in one of DEEP_IDS: #nasa (NASA card), #bob (case file), #me (the
 * core of the Milky Way) or #vcu / #ta / #aspire (any link to those works, and so does a shared URL). Closing clears the hash and
 * hands focus back to the link that opened it (returnFocusTo).
 */
export function DeepViews() {
  const [state, setState] = useState<{ open: Deep | null; returnFocusTo: HTMLElement | null }>({ open: null, returnFocusTo: null });
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (!isDeep(h)) return setState({ open: null, returnFocusTo: null });
      // opened from a shared link: focus goes to the matching link in the work list afterwards
      const back = opener.current ?? document.querySelector<HTMLElement>(`#work-${h} a[href="#${h}"], #system a[href="#${h}"]`);
      opener.current = null;
      setState({ open: h, returnFocusTo: back });
    };
    const remember = (e: MouseEvent | KeyboardEvent) => {
      const a = (e.target as Element | null)?.closest?.(OPENERS);
      if (a) opener.current = a as HTMLElement;
    };
    document.addEventListener("click", remember, true);
    window.addEventListener("hashchange", read);
    read();
    return () => {
      document.removeEventListener("click", remember, true);
      window.removeEventListener("hashchange", read);
    };
  }, []);

  const close = useCallback(() => {
    // replaceState does not fire hashchange, so state is set here
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setState((s) => ({ ...s, open: null }));
  }, []);

  const { open, returnFocusTo } = state;

  return (
    <>
      {open === "nasa" && <NasaDeepDive onClose={close} returnFocusTo={returnFocusTo} />}
      <BobCaseFile open={open === "bob"} onClose={close} returnFocusTo={returnFocusTo} />
      {open === "me" && <MeCard onClose={close} returnFocusTo={returnFocusTo} />}
      {(open === "vcu" || open === "ta" || open === "aspire") && <ExperienceCard key={open} id={open} onClose={close} returnFocusTo={returnFocusTo} />}
    </>
  );
}
