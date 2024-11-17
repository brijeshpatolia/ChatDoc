"use client";
import React from "react";
import { Button } from "./button";
import axios from "axios";
import toast from "react-hot-toast";

type Props = { isPro: boolean };

const SubscriptionButton = ({ isPro }: Props) => {
  const [loading, setLoading] = React.useState(false);

  const handleSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/stripe");
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No URL returned from API");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process the subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button disabled={loading} onClick={handleSubscription} variant="outline">
      {loading ? "Processing..." : isPro ? "Manage Subscriptions" : "Get Pro"}
    </Button>
  );
};

export default SubscriptionButton;
