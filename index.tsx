import "./styles2.css";
import { boot } from "@immediately-run/sdk/boot";
import { initDiagnosticLogger } from "./lib/logger";

initDiagnosticLogger();
boot();
