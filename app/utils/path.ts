// app/utils/path.ts

export const path = {
  to: {
    backOffice: () => "/back-office",
    // eslint-disable-next-line unused-imports/no-unused-vars
    agents: (id?: number) => `/objects`,
    // Add more routes as needed
  },
} as const;
