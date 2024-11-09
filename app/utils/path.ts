// app/utils/path.ts

export const path = {
  to: {
    backOffice: () => "/back-office",
    agents: (id: number) => `/agents/action-calls/${id}`,
    // Add more routes as needed
  },
} as const;
