"use client";

import { useState } from "react";
import styles from "@/app/page.module.css";
import Link from "next/link";

interface HeaderProps {
  names: string;
}

export default function Header({ names }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.navContainer} container`}>
        <Link href="/" className={styles.logo}>
          {names}
        </Link>

        <button className={styles.menuButton} onClick={toggleMenu} aria-label="Abrir Menu">
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`${styles.navList} ${menuOpen ? styles.mobileMenuOpen : ""}`}>
          <li>
            <a href="#noivos" className={styles.navLink} onClick={closeMenu}>
              Noivos
            </a>
          </li>
          <li>
            <a href="#nossa-historia" className={styles.navLink} onClick={closeMenu}>
              Nossa História
            </a>
          </li>
          <li>
            <a href="#locais" className={styles.navLink} onClick={closeMenu}>
              Onde e Quando
            </a>
          </li>
          <li>
            <a href="#programacao" className={styles.navLink} onClick={closeMenu}>
              Programação
            </a>
          </li>
          <li>
            <Link href="/presentes" className={styles.navLink} onClick={closeMenu}>
              Presentes
            </Link>
          </li>
          <li>
            <Link
              href="/confirmar-presenca"
              className="btn btn-confirm-menu"
              onClick={closeMenu}
              style={{ padding: "0.6rem 1.5rem" }}
            >
              Confirmar Presença
            </Link>
          </li>
        </nav>
      </div>
    </header>
  );
}
