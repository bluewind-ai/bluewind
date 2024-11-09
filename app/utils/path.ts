// app/utils/path.ts

export const path = {
  to: {
    backOffice: () => "/back-office",
    agents: (id: number) => `/agents/function-calls/${id}`,
    // Add more routes as needed
  },
} as const;
