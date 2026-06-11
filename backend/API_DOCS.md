# Backend API Documentation

Complete API documentation for the Medical Inventory Management backend.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend-domain.com/api
```

## Authentication
All endpoints except `/auth/signup`, `/auth/login`, and `/auth/verify/:token` require a JWT token in the Authorization header:

```
Authorization: Bearer {token}
```

## Error Responses
All errors follow this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User created. Check email for verification link."
}
```

**Errors:**
- 400: Email and password required
- 409: User already exists
- 500: Server error

---

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Errors:**
- 400: Email and password required
- 401: Invalid credentials
- 403: Email not verified

---

### GET /auth/verify/:token
Verify email address using verification token.

**Parameters:**
- `token` (URL param): Verification token from email

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Errors:**
- 400: Invalid or expired verification token

---

### GET /auth/me
Get current authenticated user.

**Headers:**
- Authorization: Bearer {token}

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "user",
  "emailVerified": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Errors:**
- 401: Invalid token
- 401: No token provided

---

## Inventory Endpoints

### GET /inventory
List all inventory items.

**Headers:**
- Authorization: Bearer {token}

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "sku": "ASP001",
    "name": "Aspirin",
    "description": "500mg tablet",
    "category": "Pain Relief",
    "currentQuantity": 1000,
    "reorderPoint": 100,
    "unitCost": 5.00,
    "sellingPrice": 10.00,
    "requiresPrescription": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### POST /inventory
Create new inventory item.

**Headers:**
- Authorization: Bearer {token}
- Content-Type: application/json

**Request:**
```json
{
  "sku": "ASP001",
  "name": "Aspirin",
  "description": "500mg tablet",
  "category": "Pain Relief",
  "currentQuantity": 0,
  "unitCost": 5.00,
  "sellingPrice": 10.00,
  "requiresPrescription": false
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "sku": "ASP001",
  "name": "Aspirin",
  ...
}
```

**Errors:**
- 400: Validation error
- 401: Not authenticated

---

### GET /inventory/:id
Get single inventory item.

**Parameters:**
- `id` (URL param): MongoDB _id of item

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "sku": "ASP001",
  "name": "Aspirin",
  ...
}
```

**Errors:**
- 404: Item not found

---

### PUT /inventory/:id
Update inventory item.

**Parameters:**
- `id` (URL param): MongoDB _id of item

**Request:**
```json
{
  "sellingPrice": 12.00,
  "currentQuantity": 500
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  ...
}
```

---

### DELETE /inventory/:id
Delete inventory item.

**Response (200):**
```json
{
  "message": "Item deleted"
}
```

---

## Stock Hierarchy Endpoints

### GET /inventory/:itemId/cartons
Get all cartons for an inventory item.

**Parameters:**
- `itemId`: MongoDB _id of inventory item

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "itemId": "507f1f77bcf86cd799439011",
    "cartonNumber": "CAR-001",
    "quantityOfBoxes": 2,
    "purchasePrice": 500.00,
    "receivedDate": "2024-01-15T10:30:00Z",
    "boxes": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "boxNumber": 1,
        "stripsPerBox": 100,
        "totalStrips": 100,
        "availableStrips": 95
      }
    ]
  }
]
```

---

### POST /inventory/:itemId/cartons
Create new carton for item.

**Request:**
```json
{
  "cartonNumber": "CAR-001",
  "quantityOfBoxes": 2,
  "purchasePrice": 500.00,
  "receivedDate": "2024-01-15",
  "expirationDate": "2025-01-15"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  ...
}
```

---

### POST /inventory/cartons/:cartonId/boxes
Add box to carton.

**Parameters:**
- `cartonId`: MongoDB _id of carton

**Request:**
```json
{
  "boxNumber": 1,
  "stripsPerBox": 100,
  "totalStrips": 100,
  "availableStrips": 100
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  ...
}
```

---

### DELETE /inventory/cartons/:cartonId
Delete carton and all boxes.

**Response (200):**
```json
{
  "message": "Carton deleted"
}
```

---

## Discount Endpoints

### GET /discounts/tiers
List all discount tiers.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Standard Discount",
    "discountPercentage": 10,
    "colorCode": "#FF6B6B",
    "isActive": true
  }
]
```

---

### POST /discounts/tiers
Create new discount tier.

**Request:**
```json
{
  "name": "Premium Discount",
  "discountPercentage": 15,
  "colorCode": "#4ECDC4"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  ...
}
```

---

### GET /discounts/medicines
List all medicine discounts.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "itemId": { /* inventory item */ },
    "discountTierId": { /* discount tier */ },
    "isAvailable": true
  }
]
```

---

### POST /discounts/medicines
Add discount to medicine.

**Request:**
```json
{
  "itemId": "507f1f77bcf86cd799439011",
  "discountTierId": "507f1f77bcf86cd799439014"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439015",
  ...
}
```

---

## Invoice Endpoints

### GET /invoices
List all invoices.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "invoiceNumber": "INV-1705316400000",
    "invoiceDate": "2024-01-15T10:30:00Z",
    "customerName": "John Doe",
    "totalAmount": 5000.00,
    "paymentStatus": "unpaid"
  }
]
```

---

### POST /invoices
Create new invoice.

**Request:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439011",
      "quantityStrips": 10,
      "unitPrice": 10.00,
      "discountPercentage": 0
    }
  ],
  "subtotal": 100,
  "discountAmount": 0,
  "taxAmount": 10,
  "totalAmount": 110
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "invoiceNumber": "INV-1705316400000",
  ...
}
```

---

### GET /invoices/:id
Get invoice with items.

**Parameters:**
- `id`: MongoDB _id of invoice

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "invoiceNumber": "INV-1705316400000",
  "items": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "itemId": "507f1f77bcf86cd799439011",
      "quantityStrips": 10,
      "unitPrice": 10.00,
      "lineTotal": 100
    }
  ]
}
```

---

### POST /invoices/:id/send-email
Send invoice via email.

**Parameters:**
- `id`: MongoDB _id of invoice

**Requirements:**
- Invoice must have `customerEmail` set
- Email provider configured in `.env`

**Response (200):**
```json
{
  "message": "Invoice sent"
}
```

**Errors:**
- 404: Invoice not found
- 400: Customer email not set

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No/invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Testing with Postman

1. Set base URL: `{{baseUrl}}/api`
2. After login, use token from response
3. Add to Authorization header: `Bearer {{token}}`
4. Test endpoints in order: Auth → Inventory → Stock → Invoices

---

## Rate Limiting

Currently no rate limiting. Add if needed in production.

---

## Pagination

Not yet implemented. All endpoints return all results. Add pagination for large datasets:
```
GET /inventory?page=1&limit=20
```

---

## Database Models

All timestamps are UTC ISO 8601 format.

### User
- _id: MongoDB ObjectId
- email: String (unique)
- password: String (hashed with bcryptjs)
- role: String ('user' or 'admin')
- emailVerified: Boolean
- createdAt: DateTime
- updatedAt: DateTime

### InventoryItem
- _id: MongoDB ObjectId
- sku: String (unique)
- name: String
- description: String
- category: String
- currentQuantity: Number
- unitCost: Number
- sellingPrice: Number
- requiresPrescription: Boolean
- createdAt: DateTime

### StockCarton
- _id: MongoDB ObjectId
- itemId: ObjectId (ref: InventoryItem)
- cartonNumber: String
- quantityOfBoxes: Number
- purchasePrice: Number
- receivedDate: DateTime
- expirationDate: DateTime (optional)

### StockBox
- _id: MongoDB ObjectId
- cartonId: ObjectId (ref: StockCarton)
- boxNumber: Number
- stripsPerBox: Number
- totalStrips: Number
- availableStrips: Number

### DiscountTier
- _id: MongoDB ObjectId
- name: String
- discountPercentage: Number
- colorCode: String
- isActive: Boolean

### MedicineDiscount
- _id: MongoDB ObjectId
- itemId: ObjectId (ref: InventoryItem)
- discountTierId: ObjectId (ref: DiscountTier)
- isAvailable: Boolean
- effectiveFrom: DateTime
- effectiveTo: DateTime

### Invoice
- _id: MongoDB ObjectId
- invoiceNumber: String (unique, auto-generated)
- invoiceDate: DateTime
- customerName: String
- customerEmail: String
- totalAmount: Number
- paymentStatus: String ('unpaid', 'paid', 'partial')

### InvoiceItem
- _id: MongoDB ObjectId
- invoiceId: ObjectId (ref: Invoice)
- itemId: ObjectId (ref: InventoryItem)
- quantityStrips: Number
- unitPrice: Number
- lineTotal: Number
