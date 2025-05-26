import type { ProspectCard } from "@/types/card";

export function downloadCSV(
  cards: ProspectCard[], 
  filename: string = "cards-export.csv",
  eventName: string = "Unknown Event"
) {
  if (cards.length === 0) {
    console.warn("No cards to export");
    return;
  }

  console.log(`📊 Exporting ${cards.length} cards to CSV`);

  // Define the CSV headers with event name first and split name fields
  const headers = [
    "Event Name",
    "First Name", 
    "Last Name",
    "Preferred Name",
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
    "Major"
  ];

  // Helper function to safely extract field value
  const getFieldValue = (card: ProspectCard, fieldName: string): string => {
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

  // Helper function to split name into first and last
  const splitName = (fullName: string): { firstName: string; lastName: string } => {
    if (!fullName) return { firstName: "", lastName: "" };
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return { firstName: "", lastName: "" };
    if (nameParts.length === 1) return { firstName: nameParts[0], lastName: "" };
    
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");
    return { firstName, lastName };
  };

  // Create CSV content
  const csvRows = [
    headers.join(","), // Header row
    ...cards.map(card => {
      const fullName = getFieldValue(card, "name");
      const { firstName, lastName } = splitName(fullName);
      
      const row = [
        eventName, // Event Name
        firstName, // First Name
        lastName, // Last Name
        getFieldValue(card, "preferred_first_name"), // Preferred Name
        getFieldValue(card, "email"), // Email
        getFieldValue(card, "cell"), // Phone Number
        getFieldValue(card, "date_of_birth"), // Birthday
        getFieldValue(card, "permission_to_text"), // Permission to Text
        getFieldValue(card, "address"), // Address
        getFieldValue(card, "city"), // City
        getFieldValue(card, "state"), // State
        getFieldValue(card, "zip_code"), // Zip Code
        getFieldValue(card, "high_school"), // High School
        getFieldValue(card, "class_rank"), // Class Rank
        getFieldValue(card, "students_in_class"), // Students in Class
        getFieldValue(card, "gpa"), // GPA
        getFieldValue(card, "student_type"), // Student Type
        getFieldValue(card, "entry_term"), // Entry Term
        getFieldValue(card, "major") // Major
      ];
      
      return row.map(value => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = String(value || "").replace(/"/g, '""');
        return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(",");
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