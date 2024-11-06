// app/routes/$.tsx

export function loader({ params }: { params: { "*": string } }) {
  // Don't handle debug routes
  if (params["*"]?.startsWith("debug")) {
    throw new Response("Not Found", { status: 404 });
  }

  throw new Response("Not Found", { status: 404 });
}

export default function CatchAll() {
  return null;
}
