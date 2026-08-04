export interface NgAddOptions {
  project?: string;
  /** Whether to generate the AI agent skill (defaults to true when undefined). */
  installSkill?: boolean;
  /**
   * Icon delivery mode (defaults to 'autohost' when undefined).
   * 'autohost': scan + offline subset + @iconify-json/* deps + prebuild wiring +
   * `provideIconify({ offlineCollections: iconSubset })`.
   * 'cdn': `provideIconify()` only — no subset, no prebuild wiring, no icon-set deps.
   */
  mode?: 'autohost' | 'cdn';
}
