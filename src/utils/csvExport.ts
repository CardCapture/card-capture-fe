import type { ProspectCard } from "@/types/card";

/**
 * Splits a full name into first name and last name
 * Handles various name formats and edge cases
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }

  const trimmedName = fullName.trim();
  if (!trimmedName) {
    return { firstName: '', lastName: '' };
  }

  // Split by spaces and filter out empty strings
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' };
  } else if (nameParts.length === 1) {
    // Only one name part - treat as first name
    return { firstName: nameParts[0], lastName: '' };
  } else if (nameParts.length === 2) {
    // Two parts - first and last
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    // Three or more parts - first name is first part, last name is everything else
    return { 
      firstName: nameParts[0], 
      lastName: nameParts.slice(1).join(' ') 
    };
  }
}

export function downloadCSV(
  cards: ProspectCard[], 
  filename: string = "cards-export.csv",
  eventName: string = "Unknown Event",
  fieldOrder: string[] = [],
  fieldLabelsMap: Map<string, string> = new Map(),
  slateEventId?: string | null
) {
  if (cards.length === 0) {
    console.warn("No cards to export");
    return;
  }

  console.log(`📊 Exporting ${cards.length} cards to CSV`);

  // Create a modified field order that replaces 'name' with 'first_name' and 'last_name'
  const modifiedFieldOrder = fieldOrder.flatMap(fieldKey => {
    if (fieldKey === 'name') {
      return ['first_name', 'last_name'];
    }
    return [fieldKey];
  });

  // Create a modified field labels map that includes first_name and last_name
  const modifiedFieldLabelsMap = new Map(fieldLabelsMap);
  if (fieldLabelsMap.has('name') || fieldOrder.includes('name')) {
    modifiedFieldLabelsMap.set('first_name', 'First Name');
    modifiedFieldLabelsMap.set('last_name', 'Last Name');
    modifiedFieldLabelsMap.delete('name'); // Remove the original name field
  }

  // Use dynamic headers based on the field configuration
  // Include Event Name and Slate Event ID first, then all enabled fields from the configuration
  const headers = [
    "Event Name",
    "Slate Event ID",
    ...modifiedFieldOrder.map(fieldKey => modifiedFieldLabelsMap.get(fieldKey) || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  ];

  // Fallback to hard-coded headers if no field configuration provided (for backward compatibility)
  const fallbackHeaders = [
    "Event Name",
    "Slate Event ID",
    "First Name",
    "Last Name",
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

  const csvHeaders = modifiedFieldOrder.length > 0 ? headers : fallbackHeaders;
  const csvFieldOrder = modifiedFieldOrder.length > 0 ? ["event_name", "slate_event_id", ...modifiedFieldOrder] : [
    "event_name", "slate_event_id", "first_name", "last_name", "email", "cell", "date_of_birth", "permission_to_text",
    "address", "city", "state", "zip_code", "high_school", "class_rank",
    "students_in_class", "gpa", "student_type", "entry_term", "major", "mapped_major"
  ];

  // Helper function to safely extract field value
  const getFieldValue = (card: ProspectCard, fieldName: string): string => {
    if (fieldName === "event_name") {
      return eventName;
    }
    if (fieldName === "slate_event_id") {
      return slateEventId || "";
    }
    if (fieldName === "review_status") {
      return card.review_status || "";
    }
    if (fieldName === "created_at") {
      return card.created_at ? new Date(card.created_at).toLocaleDateString() : "";
    }
    
    // Handle name splitting
    if (fieldName === "first_name" || fieldName === "last_name") {
      const nameFieldData = card.fields?.["name"];
      let fullName = "";
      
      if (typeof nameFieldData === "string") {
        fullName = nameFieldData;
      } else if (typeof nameFieldData === "object" && nameFieldData?.value !== undefined) {
        fullName = String(nameFieldData.value || "");
      }
      
      const { firstName, lastName } = splitName(fullName);
      return fieldName === "first_name" ? firstName : lastName;
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