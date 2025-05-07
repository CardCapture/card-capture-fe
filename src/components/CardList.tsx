import { useEffect, useState } from 'react';
import { ProspectCard, CardStatus } from '@/types/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateOrTimeAgo } from '@/lib/utils';
import { authFetch } from "@/lib/authFetch";

// Extended ProspectCard type for this component
interface ExtendedProspectCard extends ProspectCard {
  data?: Record<string, any>;
}

const CardList = () => {
  const [cards, setCards] = useState<ExtendedProspectCard[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await authFetch("http://localhost:8000/cards");
        const data = await response.json();

        const formatted = data.map((item: any) => {
          let parsedData = {};
          try {
            parsedData = JSON.parse(item.parsed_data || '{}');
          } catch (e) {
            console.error("Error parsing JSON for card", item.document_id || item.id);
          }

          return {
            id: item.document_id || item.id || `unknown-${Math.random().toString(36).substring(7)}`,
            document_id: item.document_id || item.id || `unknown-${Math.random().toString(36).substring(7)}`,
            status: item.review_status || 'needs_human_review',
            missingFields: item.missing_fields || [],
            imageName: item.image_name || '',
            createdAt: item.created_at || item.uploaded_at || new Date().toISOString(),
            updatedAt: item.updated_at || item.reviewed_at,
            exported_at: item.exported_at || null,
            fields: item.fields || {},
            data: parsedData,
          };
        });

        setCards(formatted);
      } catch (error) {
        console.error("Error fetching cards:", error);
      }
    };

    fetchCards();
  }, []);

  const filteredCards = selectedTab === 'all'
    ? cards
    : cards.filter(card => card.status === selectedTab);

  const getStatusCount = (status: CardStatus | 'all') => {
    if (!Array.isArray(cards)) return 0;

    const isArchived = (card: ProspectCard) => card.status === 'archived';
    const isExported = (card: ProspectCard) => !!card.exported_at;
    const hasFieldsNeedingReview = (card: ProspectCard) => {
      return Object.values(card.fields || {}).some(field => 
        field.requires_human_review && !field.reviewed
      );
    };

    switch (status) {
      case 'all':
        return cards.length;
      case 'reviewed':
        return cards.filter(c => 
          c.status === 'reviewed' && 
          !isExported(c) && 
          !isArchived(c)
        ).length;
      case 'needs_human_review':
        return cards.filter(c => 
          (c.status === 'needs_human_review' || hasFieldsNeedingReview(c)) && 
          !isExported(c) && 
          !isArchived(c)
        ).length;
      case 'exported':
        return cards.filter(c => isExported(c) && !isArchived(c)).length;
      case 'archived':
        return cards.filter(isArchived).length;
      case 'processing':
        return cards.filter(c => 
          c.status === 'processing' && 
          !isExported(c) && 
          !isArchived(c)
        ).length;
      default:
        return 0;
    }
  };

  const dataFields = [
    { key: 'name', label: 'Name' },
    { key: 'preferredFirstName', label: 'Preferred Name' },
    { key: 'email', label: 'Email' },
    { key: 'cell', label: 'Phone Number' },
    { key: 'dateOfBirth', label: 'Birthday' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zipCode', label: 'Zip Code' },
    { key: 'highSchool', label: 'High School/College' },
    { key: 'studentType', label: 'Student Type' },
    { key: 'entryTermYear', label: 'Entry Term' },
    { key: 'gpa', label: 'GPA' },
    { key: 'majorAcademicProgramOfInterest', label: 'Major' },
  ];

  const columns: ColumnDef<ExtendedProspectCard>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Date added',
      cell: ({ row }) => formatDateOrTimeAgo(row.original.createdAt),
      enableSorting: true,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        let variant: "default" | "destructive" | "secondary" | "outline" = "secondary";
        let displayText = "Unknown";

        if (status === 'reviewed') {
          variant = 'default';
          displayText = 'Reviewed';
        } else if (status === 'needs_human_review') {
          variant = 'outline';
          displayText = 'Needs Review';
        } else if (status === 'exported') {
          variant = 'default';
          displayText = 'Exported';
        } else if (status === 'archived') {
          variant = 'secondary';
          displayText = 'Archived';
        } else if (status === 'processing') {
          variant = 'secondary';
          displayText = 'Processing';
        }

        return <Badge variant={variant}>{displayText}</Badge>;
      },
      enableSorting: true,
    },
    ...dataFields.map(({ key, label }) => ({
      accessorKey: key,
      header: label,
      accessorFn: (row: ExtendedProspectCard) => {
        const fieldData = row.fields?.[key];
        return fieldData?.value || row.data?.[key] || '';
      },
      cell: ({ getValue }) => {
        const value = getValue();
        return Array.isArray(value) ? value.join(', ') : value || '-';
      },
    }))
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
      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all">All ({getStatusCount('all')})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({getStatusCount('reviewed')})</TabsTrigger>
          <TabsTrigger value="needs_human_review">Needs Review ({getStatusCount('needs_human_review')})</TabsTrigger>
          <TabsTrigger value="exported">Exported ({getStatusCount('exported')})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({getStatusCount('archived')})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-0">
          <div className="overflow-x-auto rounded-lg border max-h-[75vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className="cursor-pointer select-none hover:text-black"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: '⬆️',
                            desc: '⬇️'
                          }[header.column.getIsSorted() as string] ?? ''}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="whitespace-nowrap max-w-[200px] truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-sm text-gray-500">
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