import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, Table, Modal, Form, Input, DatePicker, InputNumber, 
  Space, message, Popconfirm, Card, Statistic, Row, Col, Select 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  SearchOutlined, ReloadOutlined, BarChartOutlined 
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;

const FlightAdmin = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({
    total_flights: 0,
    upcoming_flights: 0,
    airline_stats: [],
    popular_routes: []
  });

  // Fetch flights on component mount
  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async (searchParams = {}) => {
    setLoading(true);
    try {
      let url = '/api/flights/admin/flights/';
      // Add search params if they exist
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${url}?${params.toString()}`);
      setFlights(response.data);
    } catch (error) {
      console.error('Error fetching flights:', error);
      message.error('Failed to load flights');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/flights/admin/flights/stats/');
      setStats(response.data);
      setStatsModalVisible(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
      message.error('Failed to load flight statistics');
    }
  };

  const handleSearch = (values) => {
    fetchFlights(values);
  };

  const resetSearch = () => {
    searchForm.resetFields();
    fetchFlights();
  };

  const handleAdd = () => {
    setEditingFlightId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (flight) => {
    setEditingFlightId(flight.id);
    form.setFieldsValue({
      flight_number: flight.flight_number,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      departure_time: moment(flight.departure_time),
      arrival_time: moment(flight.arrival_time),
      available_seats: flight.available_seats,
      price: flight.price
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/flights/admin/flights/${id}/delete/`);
      message.success('Flight deleted successfully');
      fetchFlights();
    } catch (error) {
      console.error('Error deleting flight:', error);
      message.error('Failed to delete flight');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        departure_time: values.departure_time.format('YYYY-MM-DDTHH:mm:ss'),
        arrival_time: values.arrival_time.format('YYYY-MM-DDTHH:mm:ss')
      };

      if (editingFlightId) {
        // Update existing flight
        await axios.put(`/api/flights/admin/flights/${editingFlightId}/`, formattedValues);
        message.success('Flight updated successfully');
      } else {
        // Create new flight
        await axios.post('/api/flights/admin/flights/', formattedValues);
        message.success('Flight created successfully');
      }
      
      setModalVisible(false);
      fetchFlights();
    } catch (error) {
      console.error('Error saving flight:', error);
      message.error('Failed to save flight');
    }
  };

  const columns = [
    {
      title: 'Flight Number',
      dataIndex: 'flight_number',
      key: 'flight_number',
      sorter: (a, b) => a.flight_number.localeCompare(b.flight_number)
    },
    {
      title: 'Airline',
      dataIndex: 'airline',
      key: 'airline',
      sorter: (a, b) => a.airline.localeCompare(b.airline)
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin'
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination'
    },
    {
      title: 'Departure',
      dataIndex: 'departure_time',
      key: 'departure_time',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => moment(a.departure_time).unix() - moment(b.departure_time).unix()
    },
    {
      title: 'Arrival',
      dataIndex: 'arrival_time',
      key: 'arrival_time',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: 'Available Seats',
      dataIndex: 'available_seats',
      key: 'available_seats',
      sorter: (a, b) => a.available_seats - b.available_seats
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (text) => `$${text.toFixed(2)}`,
      sorter: (a, b) => a.price - b.price
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this flight?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="flight-admin-container">
      <Card title="Flight Management" extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Flight
          </Button>
          <Button icon={<BarChartOutlined />} onClick={fetchStats}>
            Statistics
          </Button>
        </Space>
      }>
        <Card title="Search Flights" style={{ marginBottom: 16 }}>
          <Form
            form={searchForm}
            layout="inline"
            onFinish={handleSearch}
            style={{ marginBottom: 16 }}
          >
            <Form.Item name="airline" label="Airline">
              <Input placeholder="Search by airline" />
            </Form.Item>
            <Form.Item name="origin" label="Origin">
              <Input placeholder="Search by origin" />
            </Form.Item>
            <Form.Item name="destination" label="Destination">
              <Input placeholder="Search by destination" />
            </Form.Item>
            <Form.Item name="flight_number" label="Flight Number">
              <Input placeholder="Search by flight number" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                Search
              </Button>
            </Form.Item>
            <Form.Item>
              <Button onClick={resetSearch} icon={<ReloadOutlined />}>
                Reset
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Table
          columns={columns}
          dataSource={flights}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add/Edit Flight Modal */}
      <Modal
        title={editingFlightId ? "Edit Flight" : "Add New Flight"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="flight_number"
            label="Flight Number"
            rules={[{ required: true, message: 'Please enter flight number' }]}
          >
            <Input placeholder="e.g. AA123" />
          </Form.Item>
          
          <Form.Item
            name="airline"
            label="Airline"
            rules={[{ required: true, message: 'Please enter airline name' }]}
          >
            <Input placeholder="e.g. American Airlines" />
          </Form.Item>
          
          <Form.Item
            name="origin"
            label="Origin"
            rules={[{ required: true, message: 'Please enter origin' }]}
          >
            <Input placeholder="e.g. New York (JFK)" />
          </Form.Item>
          
          <Form.Item
            name="destination"
            label="Destination"
            rules={[{ required: true, message: 'Please enter destination' }]}
          >
            <Input placeholder="e.g. Los Angeles (LAX)" />
          </Form.Item>
          
          <Form.Item
            name="departure_time"
            label="Departure Time"
            rules={[{ required: true, message: 'Please select departure time' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="arrival_time"
            label="Arrival Time"
            rules={[{ required: true, message: 'Please select arrival time' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="available_seats"
            label="Available Seats"
            rules={[{ required: true, message: 'Please enter available seats' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please enter ticket price' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingFlightId ? 'Update Flight' : 'Create Flight'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        title="Flight Statistics"
        visible={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setStatsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Card>
              <Statistic title="Total Flights" value={stats.total_flights} />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic title="Upcoming Flights" value={stats.upcoming_flights} />
            </Card>
          </Col>
        </Row>
        
        <Card title="Airlines" style={{ marginTop: 16 }}>
          <Table
            dataSource={stats.airline_stats}
            columns={[
              { title: 'Airline', dataIndex: 'airline', key: 'airline' },
              { title: 'Flight Count', dataIndex: 'count', key: 'count' }
            ]}
            pagination={false}
            rowKey="airline"
            size="small"
          />
        </Card>
        
        <Card title="Popular Routes" style={{ marginTop: 16 }}>
          <Table
            dataSource={stats.popular_routes}
            columns={[
              { title: 'Origin', dataIndex: 'origin', key: 'origin' },
              { title: 'Destination', dataIndex: 'destination', key: 'destination' },
              { title: 'Flight Count', dataIndex: 'count', key: 'count' }
            ]}
            pagination={false}
            rowKey={(record) => `${record.origin}-${record.destination}`}
            size="small"
          />
        </Card>
      </Modal>
    </div>
  );
};

export default FlightAdmin;