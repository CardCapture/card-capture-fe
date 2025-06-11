import type { ProspectCard } from "@/types/card";

export function downloadCSV(
  cards: ProspectCard[], 
  filename: string = "cards-export.csv",
  eventName: string = "Unknown Event",
  fieldOrder: string[] = [],
  fieldLabelsMap: Map<string, string> = new Map()
) {
  if (cards.length === 0) {
    console.warn("No cards to export");
    return;
  }

  console.log(`📊 Exporting ${cards.length} cards to CSV`);

  // Use dynamic headers based on the field configuration
  // Include Event Name first, then all enabled fields from the configuration
  const headers = [
    "Event Name",
    ...fieldOrder.map(fieldKey => fieldLabelsMap.get(fieldKey) || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  ];

  // Fallback to hard-coded headers if no field configuration provided (for backward compatibility)
  const fallbackHeaders = [
    "Event Name",
    "Name",
    "Email", 
    "Phone Number",
    "Birthday",
    "Permission to Text",
    "Address",
    "City",
    "State",
    "Zip Code",
    "High School",
    "Class Rank",
    "Students in Class",
    "GPA",
    "Student Type",
    "Entry Term",
    "Major",
    "Mapped Major"
  ];

  const csvHeaders = fieldOrder.length > 0 ? headers : fallbackHeaders;
  const csvFieldOrder = fieldOrder.length > 0 ? ["event_name", ...fieldOrder] : [
    "event_name", "name", "email", "cell", "date_of_birth", "permission_to_text",
    "address", "city", "state", "zip_code", "high_school", "class_rank",
    "students_in_class", "gpa", "student_type", "entry_term", "major", "mapped_major"
  ];

  // Helper function to safely extract field value
  const getFieldValue = (card: ProspectCard, fieldName: string): string => {
    if (fieldName === "event_name") {
      return eventName;
    }
    if (fieldName === "review_status") {
      return card.review_status || "";
    }
    if (fieldName === "created_at") {
      return card.created_at ? new Date(card.created_at).toLocaleDateString() : "";
    }
    
    const fieldData = card.fields?.[fieldName];
    if (!fieldData) return "";
    
    if (typeof fieldData === "string") return fieldData;
    if (typeof fieldData === "object" && fieldData.value !== undefined) {
      return String(fieldData.value || "");
    }
    
    return "";
  };

  // Create CSV content
  const csvRows = [
    csvHeaders.join(","), // Header row
    ...cards.map(card => {
      const row = csvFieldOrder.map(fieldKey => {
        const value = getFieldValue(card, fieldKey);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = String(value || "").replace(/"/g, '""');
        return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      });
      
      return row.join(",");
    })
  ];

  const csvContent = csvRows.join("\n");
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ CSV export completed: ${filename}`);
  } else {
    console.error("❌ CSV download not supported in this browser");
  }
} 