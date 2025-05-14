import { useEffect } from "react";
import { useLocation } from "wouter";

// Этот хак необходим из-за особенностей API
export default function HomePage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/horoscope");
  }, [navigate]);

  return null;
}
