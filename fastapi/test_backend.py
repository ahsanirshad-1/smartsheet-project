import requests
import json
import pytest

BASE_URL = "http://localhost:8000"

@pytest.fixture
def token():
    # Register user if not exists
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123!"
    }
    response = requests.post(f"{BASE_URL}/register", json=data)
    # If already exists, proceed to login
    data_login = {
        "username": "testuser",
        "password": "Test123!"
    }
    response = requests.post(f"{BASE_URL}/token", data=data_login)
    assert response.status_code == 200
    return response.json().get("access_token")

def test_register():
    print("Testing user registration...")
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123!"
    }
    response = requests.post(f"{BASE_URL}/register", json=data)
    print(f"Register response: {response.status_code}")
    if response.status_code == 200:
        print("✅ Registration successful")
        return True
    else:
        print(f"❌ Registration failed: {response.text}")
        return False

def test_register_weak_password():
    print("Testing registration with weak password...")
    data = {
        "username": "weakuser",
        "email": "weak@example.com",
        "password": "123"
    }
    response = requests.post(f"{BASE_URL}/register", json=data)
    print(f"Weak password response: {response.status_code}")
    if response.status_code == 422:
        print("✅ Weak password correctly rejected")
        return True
    else:
        print(f"❌ Weak password not rejected: {response.text}")
        return False

def test_login():
    print("Testing user login...")
    data = {
        "username": "testuser",
        "password": "Test123!"
    }
    response = requests.post(f"{BASE_URL}/token", data=data)
    print(f"Login response: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print("✅ Login successful")
        return token_data.get("access_token")
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_login_wrong_credentials():
    print("Testing login with wrong credentials...")
    data = {
        "username": "testuser",
        "password": "wrongpassword"
    }
    response = requests.post(f"{BASE_URL}/token", data=data)
    print(f"Wrong credentials response: {response.status_code}")
    if response.status_code == 401:
        print("✅ Wrong credentials correctly rejected")
        return True
    else:
        print(f"❌ Wrong credentials not rejected: {response.text}")
        return False

def test_protected_endpoint_without_token():
    print("Testing protected endpoint without token...")
    response = requests.get(f"{BASE_URL}/tasks")
    print(f"No token response: {response.status_code}")
    if response.status_code == 401:
        print("✅ Protected endpoint correctly requires authentication")
        return True
    else:
        print(f"❌ Protected endpoint does not require authentication: {response.status_code}")
        return False

def test_protected_endpoint_with_token(token):
    print("Testing protected endpoint with token...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/tasks", headers=headers)
    print(f"With token response: {response.status_code}")
    if response.status_code == 200:
        print("✅ Protected endpoint accessible with valid token")
        return True
    else:
        print(f"❌ Protected endpoint not accessible with token: {response.text}")
        return False

def test_add_task_with_token(token):
    print("Testing adding task with token...")
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    task_data = {
        "taskname": "Test Task",
        "assign": "testuser",
        "status": "pending",
        "startdate": "2023-01-01",
        "enddate": "2023-01-02",
        "sendReminder": False
    }
    response = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers)
    print(f"Add task response: {response.status_code}")
    if response.status_code == 200:
        print("✅ Task added successfully")
        return True
    else:
        print(f"❌ Failed to add task: {response.text}")
        return False

def test_invalid_token():
    print("Testing with invalid token...")
    headers = {"Authorization": "Bearer invalidtoken"}
    response = requests.get(f"{BASE_URL}/tasks", headers=headers)
    print(f"Invalid token response: {response.status_code}")
    if response.status_code == 401:
        print("✅ Invalid token correctly rejected")
        return True
    else:
        print(f"❌ Invalid token not rejected: {response.status_code}")
        return False

def test_register_duplicate():
    print("Testing duplicate user registration...")
    data = {
        "username": "dupuser",
        "email": "dup@example.com",
        "password": "Test123!"
    }
    # First registration
    response1 = requests.post(f"{BASE_URL}/register", json=data)
    # Second registration
    response2 = requests.post(f"{BASE_URL}/register", json=data)
    print(f"Duplicate register response: {response2.status_code}")
    if response2.status_code == 200:
        print("✅ Duplicate registration allowed (no unique constraint)")
        return True
    else:
        print(f"❌ Duplicate registration rejected: {response2.text}")
        return False

def test_unprotected_endpoints():
    print("Testing unprotected endpoints...")
    endpoints = ["/daily", "/team"]
    for endpoint in endpoints:
        response = requests.get(f"{BASE_URL}{endpoint}")
        print(f"{endpoint} response: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ {endpoint} accessible without authentication")
        else:
            print(f"❌ {endpoint} not accessible: {response.status_code}")

if __name__ == "__main__":
    print("Starting backend tests...\n")

    # Test registration
    test_register()
    test_register_weak_password()

    # Test login
    token = test_login()
    test_login_wrong_credentials()

    # Test protected endpoints
    test_protected_endpoint_without_token()
    if token:
        test_protected_endpoint_with_token(token)

    # Test unprotected endpoints
    test_unprotected_endpoints()

    print("\nTesting completed!")
