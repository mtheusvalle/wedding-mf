"use client";

import { useEffect, useState } from "react";
import styles from "@/app/page.module.css";

interface CountdownProps {
  weddingDate: string;
}

export default function Countdown({ weddingDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const targetDate = new Date(weddingDate).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [weddingDate]);

  if (!isClient) {
    return (
      <div className={styles.countdown}>
        <div className={styles.countdownItem}>
          <span className={styles.countdownNumber}>00</span>
          <span className={styles.countdownLabel}>Dias</span>
        </div>
        <div className={styles.countdownItem}>
          <span className={styles.countdownNumber}>00</span>
          <span className={styles.countdownLabel}>Horas</span>
        </div>
        <div className={styles.countdownItem}>
          <span className={styles.countdownNumber}>00</span>
          <span className={styles.countdownLabel}>Min</span>
        </div>
        <div className={styles.countdownItem}>
          <span className={styles.countdownNumber}>00</span>
          <span className={styles.countdownLabel}>Seg</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.countdown}>
      <div className={styles.countdownItem}>
        <span className={styles.countdownNumber}>
          {String(timeLeft.days).padStart(2, "0")}
        </span>
        <span className={styles.countdownLabel}>Dias</span>
      </div>
      <div className={styles.countdownItem}>
        <span className={styles.countdownNumber}>
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className={styles.countdownLabel}>Horas</span>
      </div>
      <div className={styles.countdownItem}>
        <span className={styles.countdownNumber}>
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className={styles.countdownLabel}>Min</span>
      </div>
      <div className={styles.countdownItem}>
        <span className={styles.countdownNumber}>
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className={styles.countdownLabel}>Seg</span>
      </div>
    </div>
  );
}
