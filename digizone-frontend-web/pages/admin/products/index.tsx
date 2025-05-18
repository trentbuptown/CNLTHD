import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { Button, Card, Table, Form, InputGroup, Badge, Modal, Row, Col } from 'react-bootstrap';
import { Search, PencilSquare, Trash, Plus } from 'react-bootstrap-icons';
import Link from 'next/link';
import { useToasts } from 'react-toast-notifications';
import axios from 'axios';
import { getBaseUrl } from '../../../services/api';
import { CURRENCY_SYMBOL } from '../../../helper/settings';

interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    platformType?: string;
    inStock: boolean;
    createdAt: string;
    description?: string;
    brand?: string;
    stock?: number;
    imageUrl?: string;
}

const initialProductForm = {
    name: '',
    description: '',
    price: '',
    category: '',
    platformType: '',
    brand: '',
    stock: '',
    imageUrl: ''
};

const AdminProducts = () => {
    const { addToast } = useToasts();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    // State for product creation
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [productForm, setProductForm] = useState(initialProductForm);
    const [creatingProduct, setCreatingProduct] = useState(false);

    // New state for product editing
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(false);
    const [currentProductId, setCurrentProductId] = useState<string | null>(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const baseUrl = getBaseUrl();
            const response = await axios.get(`${baseUrl}/api/products?limit=100`);

            if (response.data && response.data.success) {
                console.log("Fetched products:", response.data);
                // Adapt to the structure returned by the API
                const productData = response.data.products || response.data.result?.products || [];
                setProducts(productData);
            } else {
                throw new Error(response.data.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            addToast('Failed to load products. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEditClick = (product: Product) => {
        // Populate the form with product data
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            category: product.category || '',
            platformType: product.platformType || '',
            brand: product.brand || '',
            stock: product.stock?.toString() || '',
            imageUrl: product.imageUrl || ''
        });
        setCurrentProductId(product._id);
        setShowEditModal(true);
    };

    const handleEditProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentProductId) return;

        setEditingProduct(true);

        try {
            // Convert price and stock to numbers
            const productData = {
                ...productForm,
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock, 10),
                inStock: parseInt(productForm.stock, 10) > 0
            };

            // Use the Products service instead of direct axios call
            const { Products } = await import('../../../services/product.service');
            const response = await Products.updateProduct(currentProductId, productData);

            if (response && response.success) {
                addToast('Product updated successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });

                // Reset form and close modal
                setProductForm(initialProductForm);
                setShowEditModal(false);
                setCurrentProductId(null);

                // Refresh product list
                fetchProducts();
            } else {
                throw new Error(response.message || 'Failed to update product');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            addToast('Failed to update product. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setEditingProduct(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        try {
            // Use the Products service instead of direct axios call
            const { Products } = await import('../../../services/product.service');
            const response = await Products.deleteProduct(productToDelete);

            if (response && response.success) {
                setProducts(products.filter(p => p._id !== productToDelete));
                addToast('Product deleted successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });
            } else {
                throw new Error(response.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            addToast('Failed to delete product. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    const handleDeleteClick = (id: string) => {
        setProductToDelete(id);
        setShowDeleteModal(true);
    };

    // Handler for create product form submission
    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingProduct(true);

        try {
            // Convert price and stock to numbers
            const productData = {
                ...productForm,
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock, 10),
                inStock: parseInt(productForm.stock, 10) > 0
            };

            // Use the Products service instead of direct axios call
            const { Products } = await import('../../../services/product.service');
            const response = await Products.saveProduct(productData);

            if (response && response.success) {
                addToast('Product created successfully', {
                    appearance: 'success',
                    autoDismiss: true
                });

                // Reset form and close modal
                setProductForm(initialProductForm);
                setShowCreateModal(false);

                // Refresh product list
                fetchProducts();
            } else {
                throw new Error(response.message || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            addToast('Failed to create product. Please try again.', {
                appearance: 'error',
                autoDismiss: true
            });
        } finally {
            setCreatingProduct(false);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout title="Product Management">
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">All Products</h5>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus className="me-1" /> Add Product
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <div className="mb-4">
                        <InputGroup>
                            <InputGroup.Text>
                                <Search />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search by name or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading products...</p>
                        </div>
                    ) : (
                        <>
                            <Table responsive hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => (
                                            <tr key={product._id}>
                                                <td>{product.name}</td>
                                                <td>{CURRENCY_SYMBOL}{product.price}</td>
                                                <td>{product.stock || 0}</td>
                                                <td>{product.category}</td>
                                                <td>
                                                    <Badge bg={product.inStock ? 'success' : 'danger'}>
                                                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                    </Badge>
                                                </td>
                                                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleEditClick(product)}
                                                    >
                                                        <PencilSquare />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(product._id)}
                                                    >
                                                        <Trash />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-4">
                                                {searchTerm ? 'No products match your search.' : 'No products found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this product? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Create Product Modal */}
            <Modal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                size="lg"
            >
                <Form onSubmit={handleCreateProduct}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add New Product</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Product Name*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter product name"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Price (₹)*</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Category*</Form.Label>
                                    <Form.Select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Computer">Computer</option>
                                        <option value="Mobile">Mobile</option>
                                        <option value="All">All</option>
                                        <option value="Operating System">Operating System</option>
                                        <option value="Application Software">Application Software</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Platform</Form.Label>
                                    <Form.Select
                                        value={productForm.platformType}
                                        onChange={(e) => setProductForm({ ...productForm, platformType: e.target.value })}
                                    >
                                        <option value="">Select Platform</option>
                                        <option value="Windows">Windows</option>
                                        <option value="Android">Android</option>
                                        <option value="iOS">iOS</option>
                                        <option value="Linux">Linux</option>
                                        <option value="Mac">Mac</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Brand*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter brand name"
                                        value={productForm.brand}
                                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Stock/Quantity*</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        placeholder="Enter available quantity"
                                        value={productForm.stock}
                                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Image URL</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter image URL (optional)"
                                        value={productForm.imageUrl}
                                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description*</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        placeholder="Enter product description"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={creatingProduct}
                        >
                            {creatingProduct ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating...
                                </>
                            ) : 'Create Product'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Product Modal */}
            <Modal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                size="lg"
            >
                <Form onSubmit={handleEditProduct}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Product</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Product Name*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter product name"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Price (₹)*</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Category*</Form.Label>
                                    <Form.Select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Computer">Computer</option>
                                        <option value="Mobile">Mobile</option>
                                        <option value="All">All</option>
                                        <option value="Operating System">Operating System</option>
                                        <option value="Application Software">Application Software</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Platform</Form.Label>
                                    <Form.Select
                                        value={productForm.platformType}
                                        onChange={(e) => setProductForm({ ...productForm, platformType: e.target.value })}
                                    >
                                        <option value="">Select Platform</option>
                                        <option value="Windows">Windows</option>
                                        <option value="Android">Android</option>
                                        <option value="iOS">iOS</option>
                                        <option value="Linux">Linux</option>
                                        <option value="Mac">Mac</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Brand*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter brand name"
                                        value={productForm.brand}
                                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Stock/Quantity*</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        placeholder="Enter available quantity"
                                        value={productForm.stock}
                                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Image URL</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter image URL (optional)"
                                        value={productForm.imageUrl}
                                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description*</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        placeholder="Enter product description"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={editingProduct}
                        >
                            {editingProduct ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Updating...
                                </>
                            ) : 'Update Product'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </AdminLayout>
    );
};

export default AdminProducts; 