import { useState } from "react";
import { ProspectCard, CardStatus } from "@/types/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateOrTimeAgo } from "@/lib/utils";
import { useCards } from "@/hooks/useCards";

// Extended ProspectCard type for this component
interface ExtendedProspectCard extends ProspectCard {
  data?: Record<string, unknown>;
}

const CardList = () => {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Use the shared cards hook instead of duplicating the API call
  const { cards, getStatusCount, isLoading } = useCards();

  const filteredCards =
    selectedTab === "all"
      ? cards
      : cards.filter((card) => card.review_status === selectedTab);

  // Helper function for getting counts that includes "all"
  const getStatusCountWithAll = (status: CardStatus | "all") => {
    if (status === "all") {
      return cards.length;
    }
    return getStatusCount(status);
  };

  const dataFields = [
    { key: "name", label: "Name" },
    { key: "preferredFirstName", label: "Preferred Name" },
    { key: "email", label: "Email" },
    { key: "cell", label: "Phone Number" },
    { key: "dateOfBirth", label: "Birthday" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zipCode", label: "Zip Code" },
    { key: "highSchool", label: "High School/College" },
    { key: "studentType", label: "Student Type" },
    { key: "entryTermYear", label: "Entry Term" },
    { key: "gpa", label: "GPA" },
    { key: "majorAcademicProgramOfInterest", label: "Major" },
  ];

  const columns: ColumnDef<ExtendedProspectCard>[] = [
    {
      accessorKey: "created_at",
      header: "Date added",
      cell: ({ row }) => formatDateOrTimeAgo(row.original.created_at),
      enableSorting: true,
    },
    {
      accessorKey: "review_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.review_status || "unknown";
        let displayText = "Unknown";

        if (status === "reviewed") {
          displayText = "Ready for Export";
        } else if (status === "needs_review") {
          displayText = "Needs Review";
        } else if (status === "exported") {
          displayText = "Exported";
        } else if (status === "archived") {
          displayText = "Archived";
        } else if (status === "processing") {
          displayText = "Processing";
        }

        // TEMP: Hardcode a green badge for testing Tailwind class generation
        return (
          <Badge
            variant="outline"
            className="!bg-green-50 !text-green-700 !border-green-500 font-semibold text-xs px-3 py-1 rounded-full"
          >
            Test Badge
          </Badge>
        );
      },
      enableSorting: true,
    },
    ...dataFields.map(({ key, label }) => ({
      accessorKey: key,
      header: label,
      accessorFn: (row: ExtendedProspectCard) => {
        const fieldData = row.fields?.[key];
        return fieldData?.value || row.data?.[key] || "";
      },
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = getValue();
        return Array.isArray(value) ? value.join(", ") : value || "-";
      },
    })),
  ];

  const table = useReactTable({
    data: filteredCards,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      {/* Static Tailwind color test */}
      <div className="bg-green-50 text-green-700 border-green-500 border px-3 py-1 rounded-full mb-4">
        Static Test
      </div>
      <Tabs
        defaultValue="all"
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all">
            All ({getStatusCountWithAll("all")})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({getStatusCountWithAll("reviewed")})
          </TabsTrigger>
          <TabsTrigger value="needs_review">
            Needs Review ({getStatusCountWithAll("needs_review")})
          </TabsTrigger>
          <TabsTrigger value="exported">
            Exported ({getStatusCountWithAll("exported")})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({getStatusCountWithAll("archived")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-0">
          <div className="overflow-x-auto rounded-lg border max-h-[75vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="cursor-pointer select-none hover:text-black"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: "⬆️",
                            desc: "⬇️",
                          }[header.column.getIsSorted() as string] ?? ""}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="whitespace-nowrap max-w-[200px] truncate"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-8 text-sm text-gray-500"
                    >
                      No cards found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CardList;
