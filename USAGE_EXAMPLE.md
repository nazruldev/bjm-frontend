# Cara Penggunaan Hooks dan Service

## 1. Setup Awal

### Environment Variable
Tambahkan di file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### QueryProvider
Sudah di-setup di `app/layout.tsx`, jadi tidak perlu setup lagi.

## 2. Penggunaan Hooks di Komponen

### Contoh Lengkap: Halaman Outlet

```typescript
"use client";

import { useOutlets, useCreateOutlet, useDeleteOutlet } from "@/hooks/useOutlets";

export default function OutletPage() {
  // 1. Fetch data dengan pagination
  const { data, isLoading, error } = useOutlets({
    page: 1,
    limit: 10,
    search: "keyword", // optional
  });

  // 2. Mutations untuk CRUD
  const createOutlet = useCreateOutlet();
  const deleteOutlet = useDeleteOutlet();

  // 3. Handle create
  const handleCreate = async () => {
    await createOutlet.mutateAsync({
      name: "Outlet Baru",
      address: "Jl. Example",
      phoneNumber: "081234567890",
    });
    // Toast notification otomatis muncul
    // Data otomatis di-refetch
  };

  // 4. Handle delete
  const handleDelete = async (id: number) => {
    await deleteOutlet.mutateAsync(id);
    // Toast notification otomatis muncul
    // Data otomatis di-refetch
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map((outlet) => (
        <div key={outlet.id}>
          <h3>{outlet.name}</h3>
          <button onClick={() => handleDelete(outlet.id)}>Delete</button>
        </div>
      ))}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}
```

## 3. Integrasi dengan ReusableDataTablePage

Lihat file `app/outlet/example-with-hooks.tsx` untuk contoh lengkap.

### Langkah-langkah:

1. **Import hooks yang diperlukan:**
```typescript
import {
  useOutlets,
  useCreateOutlet,
  useUpdateOutlet,
  useDeleteOutlet,
  useBatchDeleteOutlets,
} from "@/hooks/useOutlets";
```

2. **Fetch data dengan pagination:**
```typescript
const { data, isLoading } = useOutlets({
  page: 1,
  limit: 10,
  search: searchQuery,
});
```

3. **Setup mutations:**
```typescript
const createOutlet = useCreateOutlet();
const updateOutlet = useUpdateOutlet();
const deleteOutlet = useDeleteOutlet();
const batchDelete = useBatchDeleteOutlets();
```

4. **Handle CRUD operations:**
```typescript
// Create
const handleAdd = async (formData: CreateOutletDto) => {
  await createOutlet.mutateAsync(formData);
};

// Update
const handleUpdate = async (data: UpdateOutletDto) => {
  await updateOutlet.mutateAsync(data);
};

// Delete
const handleDelete = async (id: number) => {
  await deleteOutlet.mutateAsync(id);
};

// Batch Delete
const handleBatchDelete = async (ids: number[]) => {
  await batchDelete.mutateAsync(ids);
};
```

5. **Pass ke ReusableDataTablePage:**
```typescript
<ReusableDataTablePage
  data={data?.data || []}
  columns={columns}
  formConfig={formConfig}
  onAdd={handleAdd}
  onDelete={handleDelete}
  onBatchDelete={handleBatchDelete}
  // ... props lainnya
/>
```

## 4. Penggunaan Service Langsung (Tanpa Hooks)

Jika perlu menggunakan service langsung tanpa hooks:

```typescript
import { outletService } from "@/services/outletService";

// Get outlets
const outlets = await outletService.getOutlets({
  page: 1,
  limit: 10,
});

// Create outlet
const newOutlet = await outletService.createOutlet({
  name: "Outlet Baru",
  address: "Jl. Example",
  phoneNumber: "081234567890",
});

// Update outlet
await outletService.updateOutlet({
  id: 1,
  name: "Outlet Updated",
});

// Delete outlet
await outletService.deleteOutlet(1);
```

## 5. Error Handling

Hooks sudah handle error secara otomatis dengan toast notification. Jika perlu custom handling:

```typescript
const createOutlet = useCreateOutlet({
  onError: (error) => {
    // Custom error handling
    console.error("Custom error:", error);
  },
  onSuccess: (data) => {
    // Custom success handling
    console.log("Success:", data);
  },
});
```

## 6. Loading States

```typescript
const createOutlet = useCreateOutlet();

// Check loading state
if (createOutlet.isPending) {
  return <div>Creating...</div>;
}

// Disable button saat loading
<button disabled={createOutlet.isPending}>
  {createOutlet.isPending ? "Creating..." : "Create"}
</button>
```

## 7. Pagination

```typescript
const [page, setPage] = React.useState(1);

const { data } = useOutlets({
  page,
  limit: 10,
});

// Access pagination info
const totalPages = data?.meta.totalPages;
const total = data?.meta.total;

// Navigate pages
<button onClick={() => setPage(page + 1)}>Next</button>
```

## 8. Filtering dan Search

```typescript
const [search, setSearch] = React.useState("");

const { data } = useOutlets({
  page: 1,
  limit: 10,
  search: search || undefined, // Pass undefined jika empty
});

// Search input
<input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search outlets..."
/>
```

## 9. Query Invalidation Manual

Jika perlu invalidate query secara manual:

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { outletKeys } from "@/hooks/useOutlets";

const queryClient = useQueryClient();

// Invalidate semua outlet queries
queryClient.invalidateQueries({ queryKey: outletKeys.all });

// Invalidate hanya list queries
queryClient.invalidateQueries({ queryKey: outletKeys.lists() });

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: outletKeys.detail(1) });
```

## 10. Tips dan Best Practices

1. **Gunakan hooks untuk UI components** - Lebih mudah dan otomatis handle loading/error
2. **Gunakan service langsung untuk server-side** - Di server components atau API routes
3. **Leverage auto-invalidation** - Hooks sudah auto invalidate setelah mutation
4. **Handle loading states** - Selalu tampilkan loading indicator
5. **Error boundaries** - Wrap komponen dengan error boundary untuk catch error
6. **Optimistic updates** - Bisa ditambahkan jika diperlukan untuk UX yang lebih baik

