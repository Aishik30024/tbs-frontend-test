"use client";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { useEffect, useState } from "react";
import QRCodeGenerator from "../../components/QRCodeGenerator";
import ThemeToggle from "../../components/ThemeToggle";
import { useUser } from "../Hooks/useUser";

function MainComponent() {
  const { data: user, loading, error: userError, refetch } = useUser();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [previousTransactions, setPreviousTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [showQR, setShowQR] = useState({});
  const [currentBook, setCurrentBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false); // New state for confirmation dialog
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log("User object in useEffect:", user);
      console.log("User book_id:", user?.book_id);
      setEmail(user.email || "");
      setPhone(user.phone_number || "");
      fetchTransactions();
      fetchCurrentBook();
    }
  }, [user]);

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please sign in.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel subscription");
      }

      await refetch();
      setError(null);
      setShowConfirmCancel(false); // Hide confirmation dialog after success
      alert("Subscription cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling subscription:", err.message);
      setError(err.message);
      setShowConfirmCancel(false); // Hide confirmation dialog on error
    }
  };
  
  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please sign in.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized: Please sign in again.");
        }
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }

      const transactions = await res.json();
      const userTransactions = transactions.filter(
        (t) => t.user_id.user_id === user.user_id
      );

      const previous = userTransactions.filter((t) =>
        ["picked_up", "dropped_off"].includes(t.status)
      );
      const pending = userTransactions.filter((t) =>
        ["pickup_pending", "dropoff_pending"].includes(t.status)
      );

      console.log("Pending Transactions:", pending);

      setPreviousTransactions(previous);
      setPendingTransactions(pending);
    } catch (err) {
      console.error("Error fetching transactions:", err.message);
      setError(err.message);
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        window.location.href = "/auth/signin";
      }
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchCurrentBook = async () => {
    setLoadingBook(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching current book for user:", user?.user_id);
      console.log("User book_id in fetchCurrentBook:", user?.book_id);

      if (!token) {
        throw new Error("No authentication token found.");
      }

      if (!user?.book_id) {
        console.log("No book_id found for user. Setting currentBook to null.");
        setCurrentBook(null);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${user.book_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Unauthorized: Please sign in again.");
        }
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch book");
      }

      const bookData = await res.json();
      console.log("Fetched book data:", bookData);
      setCurrentBook(bookData);
    } catch (err) {
      console.error("Error fetching current book:", err.message);
      setError(err.message);
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        window.location.href = "/auth/signin";
      }
    } finally {
      setLoadingBook(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/update-user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) throw new Error("Failed to update email");

      await refetch();
      setShowEmailForm(false);
    } catch (err) {
      setError("Failed to update email");
    }
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/update-user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone_number: phone }),
        }
      );

      if (!response.ok) throw new Error("Failed to update phone");

      await refetch();
      setShowPhoneForm(false);
    } catch (err) {
      setError("Failed to update phone number");
    }
  };

  const handleDropOff = () => {
    if (!currentBook) {
      setError("No book to drop off");
      return;
    }
    // Redirect to the drop-off page with the current book's book_id
    router.push(`/drop-off?book_id=${currentBook.book_id}`);
  };

  const toggleQR = (transactionId) => {
    setShowQR((prev) => {
      const newState = {
        ...prev,
        [transactionId]: !prev[transactionId],
      };
      console.log("Toggling QR for transactionId:", transactionId, "New showQR state:", newState);
      return newState;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light dark:border-primary-dark"></div>
      </div>
    );
  }

  if (userError) {
    if (userError.includes("No token found") || userError.includes("Failed to fetch user")) {
      localStorage.removeItem("token");
      window.location.href = "/auth/signin";
      return null;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-warning-light dark:text-warning-dark p-3 rounded-lg font-body">
          {userError}
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/auth/signin";
    return null;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-border-light dark:border-border-dark"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-backgroundSCD-light dark:bg-backgroundSCD-dark flex items-center justify-center">
                <i className="fas fa-user text-4xl text-text-light dark:text-text-dark"></i>
              </div>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold font-header text-text-light dark:text-text-dark">
            {user.name || "No Name Set"}
          </h1>
          <p className="mt-1 text-sm text-text-light dark:text-text-dark font-body">
            Customer ID: {user.user_id}
          </p>
        </div>

        {/* Subscription Section */}
        <div className="flex items-center justify-between px-6 py-3 rounded-lg border border-border-light dark:border-border-dark hover:border-border-light dark:hover:border-border-dark transition-colors">
          <div>
            <h2 className="text-2xl font-bold font-header text-text-light dark:text-text-dark capitalize">
              {user.subscription_type?.toUpperCase() || "BASIC"} SUBSCRIPTION
            </h2>
            <p className="text-text-light dark:text-text-dark font-body">
              Valid until{" "}
              {user.subscription_validity
                ? new Date(user.subscription_validity).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : "Not set"}
            </p>
          </div>
          <a
            href="/Subscription"
            className="inline-flex items-center px-6 py-2.5 bg-primary-light dark:bg-primary-dark text-text-light dark:text-text-dark font-button rounded-full hover:bg-primary-light dark:hover:bg-primary-dark transition-colors"
          >
            Upgrade Subscription
          </a>
        </div>

        {/* Email/Phone Update Section */}
        <div className="space-y-4">
          {showEmailForm ? (
            <form onSubmit={handleUpdateEmail} className="space-y-3">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border-light dark:border-border-dark px-4 py-2 font-body"
              />
              <div className="flex space-x-2 justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-text-light dark:text-text-dark rounded-full font-button hover:bg-primary-light dark:hover:bg-primary-dark"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="px-4 py-2 border border-border-light dark:border-border-dark rounded-full font-button hover:bg-backgroundSCD-light dark:hover:bg-backgroundSCD-dark"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between px-6 py-3 rounded-lg border border-border-light dark:border-border-dark hover:border-border-light dark:hover:border-border-dark transition-colors">
              <div className="font-body text-text-light dark:text-text-dark">
                {user.email}
              </div>
              <button
                onClick={() => setShowEmailForm(true)}
                className="px-4 py-2 text-primary-light dark:text-primary-dark rounded-full border border-primary-light dark:border-primary-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors font-button"
              >
                Update Email
              </button>
            </div>
          )}

          {showPhoneForm ? (
            <form onSubmit={handleUpdatePhone} className="space-y-3">
              <input
                type="tel"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border-light dark:border-border-dark px-4 py-2 font-body"
              />
              <div className="flex space-x-2 justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-text-light dark:text-text-dark rounded-full font-button hover:bg-primary-light dark:hover:bg-primary-dark"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhoneForm(false)}
                  className="px-4 py-2 border border-border-light dark:border-border-dark rounded-full font-button hover:bg-backgroundSCD-light dark:hover:bg-backgroundSCD-dark"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between px-6 py-3 rounded-lg border border-border-light dark:border-border-dark hover:border-border-light dark:hover:border-border-dark transition-colors">
              <div className="font-body text-text-light dark:text-text-dark">
                {user.phone_number || "Not set"}
              </div>
              <button
                onClick={() => setShowPhoneForm(true)}
                className="px-4 py-2 text-primary-light dark:text-primary-dark rounded-full border border-primary-light dark:border-primary-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors font-button"
              >
                Update Phone
              </button>
            </div>
          )}
        </div>

        {/* Current Book Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-header text-text-light dark:text-text-dark">
            Current Book
          </h2>
          {loadingBook ? (
            <div className="text-text-light dark:text-text-dark">
              Loading book...
            </div>
          ) : !currentBook ? (
            <div className="px-6 py-3 rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark font-body">
              No book currently borrowed.
            </div>
          ) : (
            <div className="flex items-center justify-between px-6 py-3 rounded-lg border border-border-light dark:border-border-dark hover:border-border-light dark:hover:border-border-dark transition-colors">
              <div className="flex items-center space-x-4">
                {currentBook.image_url ? (
                  <img
                    src={currentBook.image_url}
                    alt={currentBook.name}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-backgroundSCD-light dark:bg-backgroundSCD-dark rounded flex items-center justify-center">
                    <i className="fas fa-book text-2xl text-text-light dark:text-text-dark"></i>
                  </div>
                )}
                <div className="font-body text-text-light dark:text-text-dark">
                  <p>
                    <strong>Name:</strong> {currentBook.name}
                  </p>
                  <p>
                    <strong>Author:</strong> {currentBook.author}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDropOff}
                className="px-4 py-2 text-primary-light dark:text-primary-dark rounded-full border border-primary-light dark:border-primary-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors font-button"
                disabled={pendingTransactions.some(
                  (t) =>
                    t.book_id.book_id === currentBook.book_id &&
                    t.status === "dropoff_pending"
                )}
              >
                {pendingTransactions.some(
                  (t) =>
                    t.book_id.book_id === currentBook.book_id &&
                    t.status === "dropoff_pending"
                )
                  ? "Drop-off Pending"
                  : "Drop Off"}
              </button>
            </div>
          )}
        </div>

        {/* Previous Transactions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-header text-text-light dark:text-text-dark">
            Previous Transactions
          </h2>
          {loadingTransactions ? (
            <div className="text-text-light dark:text-text-dark">
              Loading transactions...
            </div>
          ) : previousTransactions.length === 0 ? (
            <div className="px-6 py-3 rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark font-body">
              No previous transactions found.
            </div>
          ) : (
            previousTransactions.map((transaction) => (
              <div
                key={transaction.transaction_id}
                className="flex items-center justify-between px-6 py-3 rounded-lg border border-border-light dark:border-border-dark hover:border-border-light dark:hover:border-border-dark transition-colors"
              >
                <div className="font-body text-text-light dark:text-text-dark">
                  <p>
                    <strong>Cafe:</strong> {transaction.cafe_id.name}
                  </p>
                  <p>
                    <strong>Book:</strong> {transaction.book_id.name}
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    {transaction.status === "picked_up" ? "Pickup" : "Drop-off"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pending Transactions Section (Table Format) */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-header text-text-light dark:text-text-dark">
            Pending Transactions
          </h2>
          {loadingTransactions ? (
            <div className="text-text-light dark:text-text-dark">
              Loading transactions...
            </div>
          ) : pendingTransactions.length === 0 ? (
            <div className="px-6 py-3 rounded-lg border border-border-light dark:border-border-dark text-text-light dark:text-text-dark font-body">
              No pending transactions found.
            </div>
          ) : (
            <div className="rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
              <table className="w-full text-left text-text-light dark:text-text-dark font-body">
                <thead>
                  <tr className="bg-backgroundSCD-light dark:bg-backgroundSCD-dark">
                    <th className="px-4 py-2">Cafe</th>
                    <th className="px-4 py-2">Book</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTransactions.map((transaction) => {
                    const qrData = `${transaction.transaction_id}.${user.user_id}`;
                    return (
                      <tr
                        key={transaction.transaction_id}
                        className="border-t border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-2">{transaction.cafe_id.name}</td>
                        <td className="px-4 py-2">{transaction.book_id.name}</td>
                        <td className="px-4 py-2">
                          {transaction.status === "pickup_pending"
                            ? "Pickup"
                            : "Drop-off"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => toggleQR(transaction.transaction_id)}
                            className="px-4 py-1 text-primary-light dark:text-primary-dark rounded-full border border-primary-light dark:border-primary-dark hover:bg-primary-light dark:hover:bg-primary-dark transition-colors font-button"
                          >
                            {showQR[transaction.transaction_id]
                              ? "Hide QR"
                              : "Show QR"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* QR Code Modal */}
        {Object.keys(showQR).some((key) => showQR[key]) && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            onClick={() => setShowQR({})}
          >
            {pendingTransactions.map((transaction) => {
              const qrData = `${transaction.transaction_id}.${user.user_id}`;
              return showQR[transaction.transaction_id] ? (
                <div
                  key={transaction.transaction_id}
                  className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => toggleQR(transaction.transaction_id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-black">
                    QR Code for {transaction.book_id.name}
                  </h3>
                  <QRCodeGenerator
                    bookName={transaction.book_id.name}
                    bookId={qrData}
                  />
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* Cancel Button */}
        {user.subscription_type !== "basic" && (
          <div className="text-center">
            <button
              onClick={() => setShowConfirmCancel(true)} // Show confirmation dialog
              className="inline-block px-6 py-2.5 text-sm font-medium text-warning-light dark:text-warning-dark border border-warning-light dark:border-warning-dark rounded-full hover:bg-warning-light dark:hover:bg-warning-dark transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmCancel && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center relative max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 text-black">
                Are you sure?
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to cancel your subscription? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleCancelSubscription} // Confirm cancellation
                  className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-text-light dark:text-text-dark rounded-full font-button hover:bg-primary-light dark:hover:bg-primary-dark transition-colors"
                >
                  Yes, I confirm
                </button>
                <button
                  onClick={() => setShowConfirmCancel(false)} // Cancel the dialog
                  className="px-4 py-2 border border-border-light dark:border-border-dark rounded-full font-button hover:bg-backgroundSCD-light dark:hover:bg-backgroundSCD-dark"
                >
                  No, go back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className="text-center">
          <a
            href="/auth/logout"
            className="inline-block px-6 py-2 text-sm font-medium text-warning-light dark:text-warning-dark border border-warning-light dark:border-warning-dark rounded-full hover:bg-warning-light dark:hover:bg-warning-dark transition-colors"
          >
            Log Out
          </a>
        </div>

        {/* Error Display */}
        {(userError || error) && (
          <div className="bg-warning-light dark:bg-warning-dark text-warning-light dark:text-warning-dark p-3 rounded-lg font-body">
            {userError || error}
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}

export default MainComponent;