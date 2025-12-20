/**
 * Test script for Order Merge API endpoints
 * Run with: node docs/TEST_ORDER_MERGE.js
 * 
 * Prerequisites:
 * 1. Server running on http://localhost:5000
 * 2. Valid branch manager token
 * 3. At least 2 unpaid orders from the same table
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const TOKEN = 'YOUR_BRANCH_MANAGER_TOKEN_HERE'; // Replace with actual token

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function testMergePreview(orderIds) {
  log('\n=== Testing Merge Preview ===', 'cyan');
  
  try {
    const response = await api.post('/api/orders/merge/preview', { orderIds });
    
    if (response.data.valid) {
      log('✓ Preview validation passed', 'green');
      log(`  Orders to merge: ${response.data.orderCount}`, 'blue');
      log(`  Combined total: $${response.data.combined.total.toFixed(2)}`, 'blue');
      log(`  Total items: ${response.data.combined.totalQuantity}`, 'blue');
      
      console.log('\nCombined Items:');
      response.data.combined.items.forEach(item => {
        log(`  ${item.quantity}x ${item.menuItem?.name} - $${(item.price * item.quantity).toFixed(2)}`, 'blue');
      });
      
      return response.data;
    } else {
      log(`✗ Preview validation failed: ${response.data.reason}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Preview failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testMergeExecution(orderIds) {
  log('\n=== Testing Merge Execution ===', 'cyan');
  
  try {
    const response = await api.post('/api/orders/merge', { orderIds });
    
    log('✓ Orders merged successfully', 'green');
    log(`  New order ID: ${response.data.mergedOrder._id}`, 'blue');
    log(`  Order number: ${response.data.mergedOrder.orderNumber}`, 'blue');
    log(`  Total: $${response.data.mergedOrder.total.toFixed(2)}`, 'blue');
    log(`  Items count: ${response.data.mergedOrder.items.length}`, 'blue');
    log(`  Merged from: ${response.data.mergedOrder.originalOrderIds.length} orders`, 'blue');
    
    return response.data.mergedOrder;
  } catch (error) {
    log(`✗ Merge failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testInvalidScenarios() {
  log('\n=== Testing Invalid Scenarios ===', 'cyan');
  
  // Test 1: Less than 2 orders
  log('\n1. Testing with single order...', 'yellow');
  try {
    await api.post('/api/orders/merge/preview', { orderIds: ['order1'] });
    log('✗ Should have failed but passed', 'red');
  } catch (error) {
    log(`✓ Correctly rejected: ${error.response?.data?.message}`, 'green');
  }
  
  // Test 2: Non-existent orders
  log('\n2. Testing with non-existent orders...', 'yellow');
  try {
    await api.post('/api/orders/merge/preview', { 
      orderIds: ['000000000000000000000001', '000000000000000000000002'] 
    });
    log('✗ Should have failed but passed', 'red');
  } catch (error) {
    log(`✓ Correctly rejected: ${error.response?.data?.message}`, 'green');
  }
  
  // Test 3: Empty array
  log('\n3. Testing with empty array...', 'yellow');
  try {
    await api.post('/api/orders/merge/preview', { orderIds: [] });
    log('✗ Should have failed but passed', 'red');
  } catch (error) {
    log(`✓ Correctly rejected: ${error.response?.data?.message}`, 'green');
  }
}

async function getUnpaidOrders() {
  log('\n=== Fetching Unpaid Orders ===', 'cyan');
  
  try {
    const response = await api.get('/api/branch/orders?timeFilter=today');
    const unpaidOrders = response.data.filter(o => o.paymentStatus === 'unpaid' && !o.isMerged);
    
    log(`Found ${unpaidOrders.length} unpaid orders`, 'blue');
    
    // Group by table
    const byTable = {};
    unpaidOrders.forEach(order => {
      const tableNum = order.table?.tableNumber || 'Unknown';
      if (!byTable[tableNum]) byTable[tableNum] = [];
      byTable[tableNum].push(order);
    });
    
    console.log('\nOrders by table:');
    Object.entries(byTable).forEach(([table, orders]) => {
      log(`  Table ${table}: ${orders.length} orders`, 'blue');
      orders.forEach(o => {
        log(`    - ${o.orderNumber} ($${o.total.toFixed(2)}, ${o.items.length} items)`, 'blue');
      });
    });
    
    return unpaidOrders;
  } catch (error) {
    log(`✗ Failed to fetch orders: ${error.response?.data?.message || error.message}`, 'red');
    return [];
  }
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   Order Merge API Test Suite          ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  
  // Check if token is set
  if (TOKEN === 'YOUR_BRANCH_MANAGER_TOKEN_HERE') {
    log('\n✗ Please set your branch manager token in the script', 'red');
    log('  Get token by logging in as branch manager', 'yellow');
    return;
  }
  
  // Get unpaid orders
  const unpaidOrders = await getUnpaidOrders();
  
  if (unpaidOrders.length < 2) {
    log('\n⚠ Need at least 2 unpaid orders from the same table to test merge', 'yellow');
    log('  Create orders via the user interface first', 'yellow');
    return;
  }
  
  // Find 2 orders from same table
  const byTable = {};
  unpaidOrders.forEach(order => {
    const tableId = order.table?._id;
    if (!byTable[tableId]) byTable[tableId] = [];
    byTable[tableId].push(order);
  });
  
  const testTable = Object.entries(byTable).find(([_, orders]) => orders.length >= 2);
  
  if (!testTable) {
    log('\n⚠ Need at least 2 orders from the SAME table to test merge', 'yellow');
    return;
  }
  
  const [tableId, orders] = testTable;
  const orderIds = orders.slice(0, 2).map(o => o._id);
  
  log(`\n✓ Found ${orders.length} orders on table ${orders[0].table?.tableNumber}`, 'green');
  log(`  Testing with order IDs: ${orderIds.join(', ')}`, 'blue');
  
  // Test preview
  const preview = await testMergePreview(orderIds);
  
  if (!preview) {
    log('\n✗ Preview failed, cannot proceed with merge test', 'red');
    return;
  }
  
  // Ask for confirmation before executing merge
  log('\n⚠ About to execute merge (this will modify the database)', 'yellow');
  log('  Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test execution
  const mergedOrder = await testMergeExecution(orderIds);
  
  if (mergedOrder) {
    log('\n✓ Merge completed successfully!', 'green');
    log(`  Merged order can be viewed at: ${API_URL}/orders/${mergedOrder._id}`, 'blue');
  }
  
  // Test invalid scenarios
  await testInvalidScenarios();
  
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   Test Suite Complete                  ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
}

// Run tests
main().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
