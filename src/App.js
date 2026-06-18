import React, { useState, useEffect } from "react";
import EmployeeAnalytics from "./components/EmployeeAnalytics";
import DepartmentAnalytics from "./components/DepartmentAnalytics";
import { t, getLang } from "./translations";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("employees");
  const [lang, setLang] = useState(getLang());

  useEffect(() => {
    const handleLangChange = () => {
      setLang(getLang());
    };
    window.addEventListener("langChange", handleLangChange);
    window.addEventListener("storage", handleLangChange);
    return () => {
      window.removeEventListener("langChange", handleLangChange);
      window.removeEventListener("storage", handleLangChange);
    };
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-title">
          <span>📊</span>
          <span>{t("analytics_mfe")}</span>
        </div>
        <ul className="sidebar-nav">
          <li
            className={`sidebar-item ${activeTab === "employees" ? "active" : ""}`}
            onClick={() => setActiveTab("employees")}
          >
            <span>👨‍💼</span>
            <span>{t("employees")}</span>
          </li>
          <li
            className={`sidebar-item ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => setActiveTab("departments")}
          >
            <span>🏢</span>
            <span>{t("departments")}</span>
          </li>
        </ul>
      </aside>

      {/* Main Content Workspace */}
      <main className="dashboard-main animate-fade-in" key={activeTab}>
        <div className="page-title-section">
          <h1 className="page-title-main">
            {activeTab === "employees" ? t("employee_insights") : t("department_insights")}
          </h1>
          <p className="page-subtitle">
            {activeTab === "employees" 
              ? t("emp_insights_desc")
              : t("dept_insights_desc")}
          </p>
        </div>

        <div className="animate-scale-up">
          {activeTab === "employees" && <EmployeeAnalytics />}
          {activeTab === "departments" && <DepartmentAnalytics />}
        </div>
      </main>
    </div>
  );
}

export default App;
