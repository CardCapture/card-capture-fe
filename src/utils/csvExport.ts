import type { ProspectCard } from "@/types/card";
import { standardizeState } from "./stateUtils";

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

  // Create a modified field order that ensures first_name and last_name are always included
  // and replaces any 'name' field with separate first/last fields
  const modifiedFieldOrder = [];
  let hasFirstName = false;
  let hasLastName = false;
  
  // Process field order and replace 'name' with first_name/last_name
  fieldOrder.forEach(fieldKey => {
    if (fieldKey === 'name') {
      modifiedFieldOrder.push('first_name', 'last_name');
      hasFirstName = true;
      hasLastName = true;
    } else if (fieldKey === 'first_name') {
      modifiedFieldOrder.push('first_name');
      hasFirstName = true;
    } else if (fieldKey === 'last_name') {
      modifiedFieldOrder.push('last_name');
      hasLastName = true;
    } else {
      modifiedFieldOrder.push(fieldKey);
    }
  });
  
  // Always ensure first_name and last_name are included at the beginning if not already present
  if (!hasFirstName || !hasLastName) {
    const nameFields = [];
    if (!hasFirstName) nameFields.push('first_name');
    if (!hasLastName) nameFields.push('last_name');
    modifiedFieldOrder.unshift(...nameFields);
  }

  // Create a modified field labels map that includes first_name and last_name
  const modifiedFieldLabelsMap = new Map(fieldLabelsMap);
  
  // Always ensure first_name and last_name labels are set
  modifiedFieldLabelsMap.set('first_name', 'First Name');
  modifiedFieldLabelsMap.set('last_name', 'Last Name');
  modifiedFieldLabelsMap.delete('name'); // Remove the original name field
  
  // Add standard field labels if not already present
  const standardLabels = {
    'email': 'Email',
    'cell': 'Cell Phone',
    'phone': 'Phone Number',
    'date_of_birth': 'Birthday',
    'birthday': 'Birthday',
    'permission_to_text': 'Permission to Text',
    'address': 'Address',
    'city': 'City',
    'state': 'State',
    'zip_code': 'Zip Code',
    'zip': 'Zip Code',
    'high_school': 'High School',
    'ceeb_code': 'CEEB Code',
    'class_rank': 'Class Rank',
    'students_in_class': 'Students in Class',
    'gpa': 'GPA',
    'student_type': 'Student Type',
    'entry_term': 'Entry Term',
    'major': 'Major',
    'mapped_major': 'Mapped Major',
    'middle_initial': 'Middle Initial',
    'preferred_name': 'Preferred Name'
  };
  
  for (const [key, label] of Object.entries(standardLabels)) {
    if (!modifiedFieldLabelsMap.has(key)) {
      modifiedFieldLabelsMap.set(key, label);
    }
  }

  // Use dynamic headers based on the field configuration
  // Include Event Name and Event ID first, then all enabled fields from the configuration
  const headers = [
    "Event Name",
    "Event ID",
    ...modifiedFieldOrder.map(fieldKey => modifiedFieldLabelsMap.get(fieldKey) || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  ];

  // Fallback to hard-coded headers if no field configuration provided (for backward compatibility)
  const fallbackHeaders = [
    "Event Name",
    "Event ID",
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
    "CEEB Code",
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
    "address", "city", "state", "zip_code", "high_school", "ceeb_code", "class_rank",
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
    
    // Handle name splitting - try multiple field sources
    if (fieldName === "first_name" || fieldName === "last_name") {
      let fullName = "";
      
      // Try to get name from various possible field sources
      const nameFieldData = card.fields?.["name"];
      const firstNameFieldData = card.fields?.["first_name"];
      const lastNameFieldData = card.fields?.["last_name"];
      
      // If we have separate first/last name fields, use those directly
      if (fieldName === "first_name" && firstNameFieldData) {
        if (typeof firstNameFieldData === "string") {
          return firstNameFieldData;
        } else if (typeof firstNameFieldData === "object" && firstNameFieldData?.value !== undefined) {
          return String(firstNameFieldData.value || "");
        }
      }
      
      if (fieldName === "last_name" && lastNameFieldData) {
        if (typeof lastNameFieldData === "string") {
          return lastNameFieldData;
        } else if (typeof lastNameFieldData === "object" && lastNameFieldData?.value !== undefined) {
          return String(lastNameFieldData.value || "");
        }
      }
      
      // Fallback to splitting full name field
      if (nameFieldData) {
        if (typeof nameFieldData === "string") {
          fullName = nameFieldData;
        } else if (typeof nameFieldData === "object" && nameFieldData?.value !== undefined) {
          fullName = String(nameFieldData.value || "");
        }
        
        const { firstName, lastName } = splitName(fullName);
        return fieldName === "first_name" ? firstName : lastName;
      }
      
      return "";
    }
    
    // Handle other fields with robust data extraction
    const fieldData = card.fields?.[fieldName];
    if (!fieldData) {
      // Try alternative field names for common mappings
      const alternativeFields = {
        'cell': ['phone', 'cell_phone', 'home_phone'],
        'phone': ['cell', 'cell_phone', 'home_phone'],
        'date_of_birth': ['birthday', 'birth_date'],
        'birthday': ['date_of_birth', 'birth_date'],
        'zip_code': ['zip', 'postal_code'],
        'zip': ['zip_code', 'postal_code']
      };
      
      const alternatives = alternativeFields[fieldName as keyof typeof alternativeFields];
      if (alternatives) {
        for (const altField of alternatives) {
          const altData = card.fields?.[altField];
          if (altData) {
            if (typeof altData === "string") return altData;
            if (typeof altData === "object" && altData.value !== undefined) {
              return String(altData.value || "");
            }
          }
        }
      }
      
      return "";
    }
    
    // Extract value from field data
    let value: string;
    if (typeof fieldData === "string") {
      value = fieldData;
    } else if (typeof fieldData === "object" && fieldData.value !== undefined) {
      value = String(fieldData.value || "");
    } else {
      return "";
    }
    
    // Standardize state values for consistent CSV output
    if (fieldName === "state") {
      return standardizeState(value);
    }
    
    return value;
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