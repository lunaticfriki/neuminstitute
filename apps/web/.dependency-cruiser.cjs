module.exports = {
  forbidden: [
    {
      name: 'domain-no-outward-deps',
      severity: 'error',
      from: { path: '^src/app/modules/[^/]+/domain' },
      to: { path: '^src/app/modules/[^/]+/(application|infrastructure|presentation)' },
    },
    {
      name: 'application-only-depends-on-domain',
      severity: 'error',
      from: { path: '^src/app/modules/[^/]+/application' },
      to: { path: '^src/app/modules/[^/]+/(infrastructure|presentation)' },
    },
    {
      name: 'infrastructure-no-presentation',
      severity: 'error',
      from: { path: '^src/app/modules/[^/]+/infrastructure' },
      to: { path: '^src/app/modules/[^/]+/presentation' },
    },
    {
      name: 'presentation-no-infrastructure',
      severity: 'error',
      from: { path: '^src/app/modules/[^/]+/presentation' },
      to: { path: '^src/app/modules/[^/]+/infrastructure' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json',
    },
  },
}
