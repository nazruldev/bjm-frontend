# Services Documentation

## Outlet Service

Service untuk mengelola data Outlet dengan CRUD operations dan pagination.

### Usage

```typescript
import { outletService } from "@/services/outletService";

// Get outlets with pagination
const outlets = await outletService.getOutlets({
  page: 1,
  limit: 10,
  search: "keyword",
  sortBy: "name",
  sortOrder: "asc",
});

// Get outlet by ID
const outlet = await outletService.getOutletById(1);

// Create outlet
const newOutlet = await outletService.createOutlet({
  name: "Outlet 1",
  logo: "https://example.com/logo.png",
  address: "Jl. Example No. 123",
  phoneNumber: "081234567890",
});

// Update outlet
const updated = await outletService.updateOutlet({
  id: 1,
  name: "Outlet Updated",
  address: "Jl. New Address",
});

// Delete outlet
await outletService.deleteOutlet(1);

// Batch delete
await outletService.deleteOutlets([1, 2, 3]);
```

### API Response Format

Semua response mengikuti format:

```typescript
{
  data: T,
  message?: string,
  success: boolean
}
```

Untuk paginated response:

```typescript
{
  data: T[],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  message?: string,
  success: boolean
}
```

