# Hooks Documentation

## useOutlets Hook

Hooks untuk mengelola data Outlet menggunakan TanStack Query.

### Available Hooks

#### `useOutlets(params?)`

Hook untuk mendapatkan list outlet dengan pagination.

```typescript
import { useOutlets } from "@/hooks/useOutlets";

function OutletList() {
  const { data, isLoading, error } = useOutlets({
    page: 1,
    limit: 10,
    search: "keyword",
    sortBy: "name",
    sortOrder: "asc",
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map((outlet) => (
        <div key={outlet.id}>{outlet.name}</div>
      ))}
    </div>
  );
}
```

#### `useOutlet(id)`

Hook untuk mendapatkan detail outlet berdasarkan ID.

```typescript
import { useOutlet } from "@/hooks/useOutlets";

function OutletDetail({ id }: { id: number }) {
  const { data, isLoading } = useOutlet(id);

  if (isLoading) return <div>Loading...</div>;

  return <div>{data?.data.name}</div>;
}
```

#### `useCreateOutlet()`

Hook untuk membuat outlet baru.

```typescript
import { useCreateOutlet } from "@/hooks/useOutlets";

function CreateOutletForm() {
  const createOutlet = useCreateOutlet();

  const handleSubmit = async (data: CreateOutletDto) => {
    await createOutlet.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createOutlet.isPending}>
        {createOutlet.isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

#### `useUpdateOutlet()`

Hook untuk mengupdate outlet.

```typescript
import { useUpdateOutlet } from "@/hooks/useOutlets";

function UpdateOutletForm({ outlet }: { outlet: Outlet }) {
  const updateOutlet = useUpdateOutlet();

  const handleSubmit = async (data: UpdateOutletDto) => {
    await updateOutlet.mutateAsync({
      id: outlet.id,
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={updateOutlet.isPending}>
        {updateOutlet.isPending ? "Updating..." : "Update"}
      </button>
    </form>
  );
}
```

#### `useDeleteOutlet()`

Hook untuk menghapus outlet.

```typescript
import { useDeleteOutlet } from "@/hooks/useOutlets";

function DeleteOutletButton({ id }: { id: number }) {
  const deleteOutlet = useDeleteOutlet();

  const handleDelete = async () => {
    if (confirm("Are you sure?")) {
      await deleteOutlet.mutateAsync(id);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteOutlet.isPending}>
      {deleteOutlet.isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
```

#### `useBatchDeleteOutlets()`

Hook untuk batch delete outlet.

```typescript
import { useBatchDeleteOutlets } from "@/hooks/useOutlets";

function BatchDeleteButton({ ids }: { ids: number[] }) {
  const batchDelete = useBatchDeleteOutlets();

  const handleDelete = async () => {
    if (confirm(`Delete ${ids.length} outlets?`)) {
      await batchDelete.mutateAsync(ids);
    }
  };

  return (
    <button onClick={handleDelete} disabled={batchDelete.isPending}>
      {batchDelete.isPending ? "Deleting..." : `Delete ${ids.length} items`}
    </button>
  );
}
```

### Query Keys

Query keys digunakan untuk cache management dan invalidation:

```typescript
import { outletKeys } from "@/hooks/useOutlets";

// All outlets
outletKeys.all // ["outlets"]

// Lists
outletKeys.lists() // ["outlets", "list"]

// Specific list with params
outletKeys.list({ page: 1, limit: 10 }) // ["outlets", "list", { page: 1, limit: 10 }]

// Details
outletKeys.details() // ["outlets", "detail"]

// Specific detail
outletKeys.detail(1) // ["outlets", "detail", 1]
```

