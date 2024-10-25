// src/pages/RestrictedAccess.jsx

export default function RestrictedAccess() {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h1 className="mb-4 text-3xl font-bold">Access Restricted</h1>
      <p className="text-lg">
        You do not have permission to view this page. Please contact your
        administrator if you believe this is an error.
      </p>
    </div>
  );
}
