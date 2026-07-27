// The guide's mount point. Lives in its own module with no Node-only imports so
// client components and next.config.ts can import it too. Nothing else may
// hardcode the prefix (TT-377).
export const GUIDE_BASE = "/guide";
