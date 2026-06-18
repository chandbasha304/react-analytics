import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { t, getLang } from "../translations";

const CHART_COLORS = ["#db2777", "#4f46e5", "#10b981", "#f59e0b", "#8b5cf6"];

function DepartmentAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    fetch("http://localhost:8081/department-service/api/department/analytics", {
      headers
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Unauthorized or server error");
        }
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.departmentCounts)) {
          throw new Error("Invalid response structure");
        }
        setStats(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Department Analytics fetch failed:", err.message);
        setError(t("error_dept_unavailable"));
        setStats(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p>{t("loading_dept")}</p>
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

  if (!stats) return <p>{t("no_dept_data")}</p>;

  // Sum up all employees across departments
  const totalEmployees = stats.departmentCounts.reduce((sum, d) => sum + d.count, 0);

  // Active vs Inactive count calculations
  const activeDepts = stats.departmentCounts.filter(d => d.count > 0);
  const activeDeptsCount = activeDepts.length;
  const inactiveDeptsCount = stats.departmentCounts.length - activeDeptsCount;

  // Average active team size
  const averageTeamCapacity = activeDeptsCount > 0 
    ? (totalEmployees / activeDeptsCount).toFixed(1) 
    : 0;

  // Find the largest department
  const sortedDepts = [...stats.departmentCounts].sort((a, b) => b.count - a.count);
  const largestDept = sortedDepts[0];
  const maxCount = largestDept ? largestDept.count : 1;

  // Classify departments into 3 high-level divisions
  const classifyDivision = (deptName) => {
    const n = deptName.toLowerCase();
    if (n.includes("engineering") || n.includes("dev") || n.includes("ai") || n.includes("ml") || n.includes("ux") || n.includes("ui")) {
      return "Core Technology";
    }
    if (n.includes("devops") || n.includes("cloud") || n.includes("security") || n.includes("operations")) {
      return "Infrastructure & Security";
    }
    return "Governance & Strategy"; // QA, Product Management, BI, etc.
  };

  // Compute Division aggregates
  const divisionMap = {};
  stats.departmentCounts.forEach(d => {
    const div = classifyDivision(d.name);
    divisionMap[div] = (divisionMap[div] || 0) + d.count;
  });

  const divisionData = Object.keys(divisionMap).map(div => ({
    name: div,
    value: divisionMap[div]
  })).sort((a, b) => b.value - a.value);

  // Render icons/emojis dynamically based on name
  const getDeptIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("engineering") || n.includes("dev")) return "💻";
    if (n.includes("qa") || n.includes("test")) return "🔬";
    if (n.includes("ui") || n.includes("ux") || n.includes("design")) return "🎨";
    if (n.includes("security") || n.includes("cyber")) return "🛡️";
    if (n.includes("product") || n.includes("manage")) return "📋";
    if (n.includes("intel") || n.includes("data") || n.includes("bi")) return "📊";
    if (n.includes("cloud") || n.includes("ops")) return "☁️";
    return "🏢";
  };

  return (
    <div className="analytics-layout">
      {/* 4-Card Executive KPI Grid */}
      <div className="kpi-grid kpi-grid-pbi">
        <div className="kpi-card kpi-violet">
          <div className="kpi-icon-wrapper kpi-icon-violet">🏢</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("total_departments")}</span>
            <span className="kpi-value">{stats.totalDepartments}</span>
            <span className="kpi-detail">{t("corp_structures")}</span>
          </div>
        </div>

        <div className="kpi-card kpi-secondary">
          <div className="kpi-icon-wrapper kpi-icon-secondary">👥</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("assigned_headcount")}</span>
            <span className="kpi-value">{totalEmployees}</span>
            <span className="kpi-detail">{t("assigned_fte")}</span>
          </div>
        </div>

        <div className="kpi-card kpi-primary">
          <div className="kpi-icon-wrapper kpi-icon-primary">⚡</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("average_capacity")}</span>
            <span className="kpi-value">{averageTeamCapacity}</span>
            <span className="kpi-detail">{t("ftes_per_team")}</span>
          </div>
        </div>

        <div className="kpi-card kpi-accent">
          <div className="kpi-icon-wrapper kpi-icon-accent">⚠️</div>
          <div className="kpi-content">
            <span className="kpi-label">{t("empty_units")}</span>
            <span className="kpi-value">{inactiveDeptsCount}</span>
            <span className="kpi-detail">{t("awaiting_staff")}</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Distribution Panels */}
      <div className="chart-panel-row">
        {/* Headcount Bar Chart */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">📊 {t("dept_distribution")}</h3>
            <span className="panel-subtitle-text">
              {t("granular_distribution")}
            </span>
          </div>
          
          <div className="chart-container-large">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentCounts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <defs>
                  <linearGradient id="deptGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.35}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: "600" }} 
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: "rgba(255, 255, 255, 0.95)", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-md)",
                    fontFamily: "var(--font-family)",
                    fontSize: "13px"
                  }} 
                  formatter={(value) => {
                    const percentage = totalEmployees > 0 
                      ? ((value / totalEmployees) * 100).toFixed(1) 
                      : 0;
                    return [`${value} ${t("employees")} (${percentage}%)`, t("total_headcount")];
                  }}
                />
                <Bar dataKey="count" fill="url(#deptGradient)" radius={[6, 6, 0, 0]}>
                  {stats.departmentCounts.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      stroke="var(--primary)"
                      strokeWidth={entry.count > 0 ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Division Breakdown Donut Chart */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">🍰 {t("segment_share")}</h3>
            <span className="panel-subtitle-text">
              {t("segment_desc")}
            </span>
          </div>

          <div className="donut-chart-layout">
            <div className="donut-chart-wrapper-dept">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={divisionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {divisionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
            
            {/* Division legends */}
            <div className="legend-list-dept">
              {divisionData.map((entry, index) => {
                const percentage = ((entry.value / totalEmployees) * 100).toFixed(1);
                return (
                  <div key={index} className="legend-item-dept">
                    <div className="legend-item">
                      <div className="legend-bullet" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                    <span>{entry.value} {t("fte")} ({percentage}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sorted Department Sizing Directory */}
      <div className="dashboard-panel">
        <div className="panel-header panel-header-clean">
          <div className="flex-column-gap-4">
            <h3 className="panel-title">🗂️ {t("dept_matrix")}</h3>
            <span className="panel-title-desc">
              {t("ranked_list")}
            </span>
          </div>
        </div>

        <div className="dept-card-grid">
          {sortedDepts.map((dept, index) => {
            const percentageOfMax = maxCount > 0 ? (dept.count / maxCount) * 100 : 0;
            const overallPercentage = totalEmployees > 0 ? ((dept.count / totalEmployees) * 100).toFixed(1) : 0;

            return (
              <div className="dept-card padding-22" key={index}>
                <div className="dept-card-header">
                  <div className="dept-card-icon">{getDeptIcon(dept.name)}</div>
                  {dept.count > 0 ? (
                    <span className="dept-card-count">{dept.count}</span>
                  ) : (
                    <span className="inactive-badge">{t("empty")}</span>
                  )}
                </div>
                <div className="flex-column-gap-4 margin-top-4">
                  <h4 className="dept-card-name dept-name-small">{dept.name}</h4>
                  <div className="designation-desc">
                    {classifyDivision(dept.name)}
                  </div>
                  {dept.count > 0 && (
                    <div className="share-text margin-top-4">
                      {overallPercentage}% {t("workforce_share")}
                    </div>
                  )}
                </div>
                {dept.count > 0 && (
                  <div className="progress-container margin-top-10">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${percentageOfMax}%` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DepartmentAnalytics;
