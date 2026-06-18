import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { t, getLang } from "../translations";

const COLORS = [
  "#db2777", // Pink/Rose
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#f43f5e"  // Rose-red
];

function EmployeeAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lang, setLang] = useState(getLang());
  
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  useEffect(() => {
    const handleLangChange = () => setLang(getLang());
    window.addEventListener("langChange", handleLangChange);
    window.addEventListener("storage", handleLangChange);
    return () => {
      window.removeEventListener("langChange", handleLangChange);
      window.removeEventListener("storage", handleLangChange);
    };
  }, []);

  useEffect(() => {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    setLoading(true);
    fetch("http://localhost:8080/employee-service/api/employees/analytics", {
      headers
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unauthorized or server error");
        }
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.designationCounts)) {
          throw new Error("Invalid response structure");
        }
        setStats(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Employee Analytics fetch failed:", err.message);
        setError(t("error_unavailable"));
        setStats(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>{t("loading_workforce")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-wrapper loading-error-wrapper">
        <span className="warning-icon">⚠️</span>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!stats) return <p>{t("no_data")}</p>;

  // Format single currency values
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Format large values like payroll (in Crores/Lakhs)
  const formatPayroll = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return formatCurrency(val);
  };

  // Power BI Aggregation: Classify 31 designations into 7 high-level Job Families
  const classifyJobFamily = (title) => {
    const tVal = title.toLowerCase();
    if (tVal.includes("ux") || tVal.includes("ui") || tVal.includes("design")) return "UI/UX & Design";
    if (tVal.includes("qa") || tVal.includes("tester") || tVal.includes("test")) return "QA & Testing";
    if (tVal.includes("devops") || tVal.includes("cloud") || tVal.includes("reliability") || tVal.includes("sre")) return "Cloud & DevOps";
    if (tVal.includes("data") || tVal.includes("scientist") || tVal.includes("architect") || tVal.includes("bi") || tVal.includes("reporting")) return "Data & Analytics";
    if (tVal.includes("product") || tVal.includes("owner") || tVal.includes("analyst") || tVal.includes("business")) return "Product & Business";
    if (tVal.includes("security")) return "Cyber Security";
    return "Software Development"; // Default for engineers, tech leads, etc.
  };

  // Compute job family headcount aggregates
  const familyMap = {};
  stats.designationCounts.forEach(item => {
    const family = classifyJobFamily(item.designation);
    familyMap[family] = (familyMap[family] || 0) + item.count;
  });

  const jobFamilyData = Object.keys(familyMap).map(family => ({
    name: family,
    value: familyMap[family]
  })).sort((a, b) => b.value - a.value);

  // Compute annual payroll estimate
  const estimatedPayroll = stats.totalEmployees * stats.averageSalary;

  // Specific Designation Ranking (Top 5 roles)
  const sortedDesignations = [...stats.designationCounts].sort((a, b) => b.count - a.count);
  const top5Designations = sortedDesignations.slice(0, 5).map(d => ({
    name: d.designation,
    count: d.count
  }));

  // Designation directory search filter
  const filteredDesignations = sortedDesignations.filter(d =>
    d.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="analytics-layout">
      {/* 4-Card Executive KPI Grid */}
      <div className="kpi-grid kpi-grid-pbi">
        <div className="kpi-card kpi-primary">
          <div className="kpi-icon-wrapper kpi-icon-primary">👥</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("total_headcount")}</span>
            <span className="kpi-value">{stats.totalEmployees}</span>
            <span className="kpi-detail">{t("active_fte")}</span>
          </div>
        </div>

        <div className="kpi-card kpi-secondary">
          <div className="kpi-icon-wrapper kpi-icon-secondary">💳</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("average_salary")}</span>
            <span className="kpi-value">{formatCurrency(stats.averageSalary)}</span>
            <span className="kpi-detail">{t("mean_pkg")}</span>
          </div>
        </div>

        <div className="kpi-card kpi-violet">
          <div className="kpi-icon-wrapper kpi-icon-violet">💰</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("est_payroll")}</span>
            <span className="kpi-value">{formatPayroll(estimatedPayroll)}</span>
            <span className="kpi-detail">{t("total_budget")}</span>
          </div>
        </div>

        <div className="kpi-card kpi-accent">
          <div className="kpi-icon-wrapper kpi-icon-accent">🏆</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("top_talent")}</span>
            <span className="kpi-value kpi-value-small">
              {stats.highestPaidEmployee}
            </span>
            <span className="kpi-detail">{t("highest_comp")}</span>
          </div>
        </div>
      </div>

      {/* Corporate Visual Breakdown Panels */}
      <div className="chart-panel-row">
        {/* Donut Chart representing Functional Job Families */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">🧬 {t("workforce_division")}</h3>
            <span className="panel-subtitle-text">
              {t("grouped_share")}
            </span>
          </div>
          <div className="donut-chart-layout">
            <div className="donut-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobFamilyData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {jobFamilyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} ${t("employees")}`, t("total_headcount")]}
                    contentStyle={{ 
                      background: "rgba(255, 255, 255, 0.95)", 
                      border: "1px solid var(--border-color)", 
                      borderRadius: "12px",
                      boxShadow: "var(--shadow-md)"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Elegant compact legend */}
            <div className="legend-grid">
              {jobFamilyData.map((entry, index) => {
                const percentage = ((entry.value / stats.totalEmployees) * 100).toFixed(1);
                return (
                  <div key={index} className="legend-item">
                    <div className="legend-bullet" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="legend-text">
                      {entry.name}: {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Horizontal Bar Chart showing Ranked specific roles */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">🏆 {t("top_roles")}</h3>
            <span className="panel-subtitle-text">
              {t("granular_rank")}
            </span>
          </div>
          <div className="chart-container-large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top5Designations}
                layout="vertical"
                margin={{ top: 15, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "var(--text-main)", fontWeight: "600" }} 
                  width={90}
                />
                <Tooltip 
                  formatter={(value) => [`${value} ${t("employees")}`, t("total_headcount")]}
                  contentStyle={{ 
                    background: "rgba(255, 255, 255, 0.95)", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-md)"
                  }} 
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={18}>
                  {top5Designations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Designation Registry (Searchable table of all 31 items) */}
      <div className="dashboard-panel">
        <div className="panel-header panel-header-clean">
          <div className="flex-column-gap-4">
            <h3 className="panel-title">📇 {t("role_registry")}</h3>
            <span className="panel-title-desc">
              {t("granular_positions")}
            </span>
          </div>
          <div className="panel-actions width-280">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="panel-search-input"
                placeholder={t("search_roles")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="designation-list margin-top-16">
          {filteredDesignations.length > 0 ? (
            filteredDesignations.map((d, index) => {
              const share = ((d.count / stats.totalEmployees) * 100).toFixed(1);
              return (
                <div className="designation-item padding-14-20" key={index}>
                  <div className="flex-column-gap-4">
                    <span className="designation-name dept-name-small">{d.designation}</span>
                    <span className="designation-desc">
                      {classifyJobFamily(d.designation)} {t("division")}
                    </span>
                  </div>
                  <div className="flex-align-center-gap-12">
                    <span className="share-text">
                      {share}% {t("share")}
                    </span>
                    <span className="designation-badge padding-5-12">
                      {d.count} {t("staff")}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="loading-wrapper margin-top-16">
              {t("no_match")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeAnalytics;
