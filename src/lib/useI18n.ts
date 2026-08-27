import { useContext } from "react";
import { LangContext } from "./langContext";

export function useI18n() {
  return useContext(LangContext);
}
