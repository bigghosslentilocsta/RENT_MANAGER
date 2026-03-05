const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const generateExcelBackup = async (flats, tenants, payments) => {
  const wb = XLSX.utils.book_new();

  // 1. Dashboard Sheet - Current flats
  const dashboardData = flats.map((flat) => ({
    "Flat #": flat.number,
    "Tenant": flat.currentTenant?.name || "Vacant",
    "Phone": flat.currentTenant?.phone || "-",
    "Monthly Rent": flat.currentTenant?.agreedRent || flat.baseRent || 0,
    "Status": flat.isOccupied ? "Occupied" : "Vacant",
    "Lease Start": flat.currentTenant?.leaseStart ? new Date(flat.currentTenant.leaseStart).toLocaleDateString('en-GB') : "-"
  }));
  const dashboardSheet = XLSX.utils.json_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(wb, dashboardSheet, "Current Flats");

  // 2. Rent History Sheet - All payments
  const rentData = payments.map((payment) => ({
    "Month": payment.month,
    "Flat #": payment.flatId?.number || "Unknown",
    "Tenant": payment.tenantId?.name || "N/A",
    "Phone": payment.tenantId?.phone || "-",
    "Amount": payment.amount,
    "Status": payment.status,
    "Paid Date": payment.date ? new Date(payment.date).toLocaleDateString('en-GB') : "-"
  }));
  const rentSheet = XLSX.utils.json_to_sheet(rentData);
  XLSX.utils.book_append_sheet(wb, rentSheet, "Rent History");

  // 3. Tenant History Sheet - Past tenants
  const pastTenants = tenants.filter((t) => t.status === "Past");
  const tenantData = pastTenants.map((tenant) => {
    const start = tenant.leaseStart ? new Date(tenant.leaseStart) : null;
    const end = tenant.vacatingDate ? new Date(tenant.vacatingDate) : null;
    let stayDays = null;
    if (start && end) {
      const diffMs = end.getTime() - start.getTime();
      stayDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      "Tenant": tenant.name,
      "Phone": tenant.phone,
      "Agreed Rent": tenant.agreedRent,
      "Lease Start": start ? start.toLocaleDateString('en-GB') : "-",
      "Vacated Date": end ? end.toLocaleDateString('en-GB') : "-",
      "Days Stayed": stayDays || "-"
    };
  });
  const tenantSheet = XLSX.utils.json_to_sheet(tenantData);
  XLSX.utils.book_append_sheet(wb, tenantSheet, "Past Tenants");

  // 4. Summary Sheet
  const today = new Date().toLocaleDateString('en-GB');
  const totalFlats = flats.length;
  const occupiedFlats = flats.filter((f) => f.isOccupied).length;
  const vacantFlats = totalFlats - occupiedFlats;
  const totalMonthlyRent = flats
    .filter((f) => f.isOccupied)
    .reduce((sum, f) => sum + (f.currentTenant?.agreedRent || 0), 0);

  const summaryData = [
    ["RENT MANAGEMENT BACKUP REPORT"],
    [],
    ["Backup Date", today],
    [],
    ["PROPERTY SUMMARY"],
    ["Total Flats", totalFlats],
    ["Occupied Flats", occupiedFlats],
    ["Vacant Flats", vacantFlats],
    ["Total Monthly Rent", totalMonthlyRent],
    [],
    ["TENANT SUMMARY"],
    ["Active Tenants", flats.filter((f) => f.isOccupied).length],
    ["Past Tenants", pastTenants.length]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary", 0);

  // Generate filename with current date
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const fileName = `Rent-Management-Backup-${dateStr}.xlsx`;
  const filePath = path.join(__dirname, "../../", fileName);

  // Write file
  XLSX.writeFile(wb, filePath);

  return { fileName, filePath };
};

module.exports = { generateExcelBackup };
