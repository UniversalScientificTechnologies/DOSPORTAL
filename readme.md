# DOSPORTAL

![image](https://github.com/UniversalScientificTechnologies/xDOS_doc/assets/5196729/6b18ef7f-3251-4674-94ab-62444ec7ba43)

> Preview from DOSPORTAL record page.

DOSPORTAL is a web-based tool designed to manage and analyze dosimetry and spectrometry data, primarily from measurements conducted onboard aircraft. It provides an intuitive user interface for visualizing measurements, comparing datasets, and facilitating detector management. DOSPORTAL is being developed in collaboration with the [Nuclear Physics Institute CAS](https://www.ujf.cas.cz/en/) and (Universal Scientific Technologies s.r.o](https://www.ust.cz/). The platform is accessible via a web interface, ensuring users can interact with the data without the need for specialized software.

## Features

### Current Capabilities

- Upload log files and trajectory files (CSV, GPX formats)
- Compare multiple measurement records in a single graph
- Display radiation intensity progress and energy spectra for selected time intervals
- Cross-filtering by energy and time
- Manage detectors and maintain service logs
- Display telemetry and support data (temperature, pressure, etc.)
- Basic user access control and permission settings

### Planned Enhancements

- Automatic CARI-7a model calculations and anomaly detection
- Automated synchronization of flight trajectories with radiation measurements
- Improved data visualization
- Real-time monitoring and visualization of ongoing measurements
- Expanded support of third-party detectors as plugins (e.g., Liulin and other instruments)
- Dose (absorbed in silicon) calculation from selected time range
- Advanced tool for absolute time calibration of records
- Semi-automated log uploading

## Requirements

DOSPORTAL is designed to be platform-independent, ensuring accessibility from various devices without the need for specialized software. It operates via modern web browsers and requires an active internet connection.

## Supported Detectors

### Currently Supported:

- **[AIRDOS Series](https://docs.dos.ust.cz/airdos/)**: Detectors designed for measuring ionizing radiation at flight altitudes aboard aircraft.
- **[LABDOS Series](https://docs.dos.ust.cz/labdos)**: Portable ionizing radiation spectrometer-dosimeters intended for laboratory measurements or personal dosimetry.
- **[GEODOS Series](https://docs.dos.ust.cz/geodos)**: Detectors suitable for ground-based applications, both mobile and stationary.

### Planned Support:

- **Liulin**: Subject to data format compatibility and integration feasibility.

## Installation & Usage

### Prerequisites

- Web browser with modern JavaScript support
- Internet connection for accessing DOSPORTAL

### Running DOSPORTAL

1. Access the DOSPORTAL web interface at [portal.dos.ust.cz](https://portal.dos.ust.cz/).
2. Register or log in to your account.
3. Upload log and trajectory files for processing.
4. Select measurement records to visualize and compare data.
5. Adjust display parameters as needed for detailed analysis.

## Known Issues & Challenges

- API access to flight trajectory data is costly and request limited.
- Manual synchronization of trajectory and dose graphs is cumbersome.
- Establishing a standardized data format for diverse detector logs remains a challenge.

## Future Roadmap

- Semi-automated log uploading to DOSPORTAL
- Dose calculation for specific time ranges in a dataset
- Enhanced user access control for institutional collaboration
- Real-time data monitoring and automated detector management
- Organizations: User access control to individual records
- Firmware updates and configuration management for detectors
- Automatic data upload from detectors for near real-time monitoring

For more information or to contribute to the project, please contact support@ust.cz

## Instructions for Contributors

**Prerequirements:** Docker and Docker Compose for local development.

### Secrets Configuration

Create environment file and setup credentials as needed.

```bash
cp .env.example .env
```

### Local Development (Docker Compose)

0. Create `.env` file, adjust variables (`.env.example` is provided)

1. Start services

   ```bash
   sudo docker compose up -d
   ```

2. Create the media bucket in MinIO

   ```bash
   docker compose exec backend python manage.py init_dosportal
   ```

3. Init database & minio(s3 bucket)

   ```bash
   docker compose exec backend python3 manage.py makemigrations
   ```

   ```bash
   docker compose exec backend python3 manage.py migrate
   ```

4. Access services
   - React frontend: http://localhost:8080
   - Django Admin: http://localhost:8080/admin
   - Django API: http://localhost:8080/api
   - MinIO console: http://localhost:8080/s3

5. Tests (backend)

   > With running project.

   ```bash
   docker compose exec backend pytest DOSPORTAL/tests/
   ```
