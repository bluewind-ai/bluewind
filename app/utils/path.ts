// app/utils/path.ts

export const path = {
  to: {
    backOffice: () => "/back-office",
    agents: (id: number) => `/agents/objects?function-call-id=${id}`,
    // Add more routes as needed
  },
} as const;
