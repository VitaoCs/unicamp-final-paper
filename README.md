# unicamp-final-paper

# **Table of Contents**

- [**Table of Contents**](#table-of-contents)
  - [Overview](#overview)
  - [Initial Configuration](#initial-configuration)
    - [Installing Docker and Docker-Compose](#installing-docker-and-docker-compose)
    - [Creating Docker Image for ROS robot](#creating-docker-image-for-ros-robot)
    - [Install Prometheus, Node-Exporter and Pushgateway](#install-prometheus-node-exporter-and-pushgateway)
    - [Install Grafana](#install-grafana)
    - [Install NGROK](#install-ngrok)
  - [Executing the experiment](#executing-the-experiment)
    - [Run ROS simulation](#run-ros-simulation)
    - [Run metrics crawler](#run-metrics-crawler)

## Overview

This is my final paper for my graduation on Control and Automation Engineering at UNICAMP, with the purpose of developing a virtual environment for a robot embedded system with monitor and security strategies.

## Initial Configuration

Make sure to update your system dependencies:

```bash
  sudo apt-get update; sudo apt-get upgrade
```

### Installing Docker and Docker-Compose

```bash
    sudo -E apt-get -y install apt-transport-https ca-certificates software-properties-common && \
    curl -sL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - && \
    arch=$(dpkg --print-architecture) && \
    sudo -E add-apt-repository "deb [arch=${arch}] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" && \
    sudo -E apt-get update && \
    sudo -E apt-get -y install docker-ce docker-compose
```

```bash
    sudo systemctl daemon-reload
    sudo systemctl restart docker
```

### Creating Docker Image for ROS robot

For this project we are gonna use a simulated robot system using Docker images from the project [ros2_docker_examples](https://github.com/DominikN/ros2_docker_examples) from [DominikN](https://github.com/DominikN). So on this repository root, execute the following commands:

```bash
    cd unicamp-final-paper
    mkdir apps
    cd apps
    git clone git@github.com:DominikN/ros2_docker_examples.git
```

Enter on the `ros2_docker_examples` and build the Docker image:

```bash
    cd ros2_docker_examples
    sudo chmod +x eg1/ros_entrypoint.sh
    sudo docker build -t turtle_demo -f eg1/Dockerfile .
    xhost local:root
```

### Install Prometheus, Node-Exporter and Pushgateway

Those applications will be used to monitor our system and also the ROS robot simulation. Following the tutorial from [Monitoring Linux Host Metrics With the Node Exporter](https://prometheus.io/docs/guides/node-exporter/) and [Prometheus Pushgateway](https://github.com/prometheus/pushgateway/blob/master/README.md), you can execute:

```bash
    cd apps
    wget https://github.com/prometheus/node_exporter/releases/download/v*/node_exporter-*.*.*.linux-amd64.tar.gz
    tar xvfz node_exporter-*.*-amd64.tar.gz
    cd node_exporter-*.*-amd64
    ./node_exporter
```

Your node-exporter metrics will be availible on <http://localhost:9100/metrics>

To install your Pushgateway instance, execute:

```bash
docker pull prom/pushgateway
docker run -d -p 9091:9091 prom/pushgateway
```

Your Pushgateway instance will be availible on <http://localhost:9091/>

To install Prometheus, run:

```bash
    wget https://github.com/prometheus/prometheus/releases/download/v*/prometheus-*.*-amd64.tar.gz
    tar xvf prometheus-*.*-amd64.tar.gz
    cd prometheus-*.*
```

And configure your `prometheus.yml` file with the following configurations:

```javascript
global:
  scrape_interval: 1s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:

scrape_configs:
  - job_name: "node_exporter"
    static_configs:
      - targets: ["localhost:9100"]
  - job_name: "pushgateway"
    static_configs:
      - targets: ["localhost:9091"]
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

To execute it with your configuration file, run:

```bash
./prometheus --config.file=./prometheus.yml
```

Your Prometheus instance will be availible on <http://localhost:9090/>

### Install Grafana

Follow the process described on [Download Grafana](https://grafana.com/grafana/download)
To start the server, run:

```bash
sudo systemctl daemon-reload
sudo systemctl start grafana-server
sudo systemctl status grafana-server
```

### Install NGROK

Install ngrok dependency globally to be used on this project. Follow the steps to configure in []()

```bash
sudo snap install ngrok
```

### Setup Grafana Dashboard

Import the Grafana dashboard for this experience from `./grafana/dashboard.json`

## Executing the experiment

### Run ROS simulation

Enter on `./apps/ros2_docker_examples` and execute the following command to bring it up the turtlesim simulaton:

```bash
sudo docker run --rm -it --env DISPLAY --volume /tmp/.X11-unix:/tmp/.X11-unix:rw turtle_demo ros2 launch my_turtle_bringup turtlesim_demo.launch.py >> output.txt
```

In another terminal window, to retrieve the simulated robot position, run:

```bash
sudo docker run --rm -it --env DISPLAY --volume /tmp/.X11-unix:/tmp/.X11-unix:rw turtle_demo ros2 topic echo /turtle1/pose >> position.txt
```

### Run metrics crawler

Enter on the root of this repository `./` and execute the index file to retrive the custom metrics of thr ROS simulation:

```bash
node index.js
```

This app also expose an external URL to be accessed outside your network (localhost). You NGROK data would be availible on <http://127.0.0.1:4040/inspect/http>
