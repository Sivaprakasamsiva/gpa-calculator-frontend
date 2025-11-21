// src/components/Layout/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400 py-6 border-t dark:border-gray-700">
      <p>
        Made by <span className="font-semibold">Sivaprakasam</span> •{" "}
        <a
          href="https://github.com/Sivaprakasamsiva/GradeTrack-Pro-GPA-CGPA-Calculator-with-Admin-Panel.git"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
        >
          GitHub
        </a>
      </p>
    </footer>
  );
};

export default Footer;
