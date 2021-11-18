import React, { Component } from 'react';
import { TouchableOpacity, Image, Switch, Alert, Platform, View, Text, Button, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import Base64 from 'base-64';

export default class SensorsComponent extends Component {
  constructor() {
    super()
    this.manager = new BleManager() // Create BLE manager object
    this.service = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
    this.characteristicW = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    this.characteristicN = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
    this.state = {
      info: "",
      // values: [],
      // count: 0,
      switch_val: true,
      app_state: "NewState"
    }
    this.device = false;
    //this.app_state = "";
  }

  toggleSwitch = async () => {
    this.setState({switch_val: !this.state.switch_val})
    const text = this.state.switch_val ? Base64.encode("open") : Base64.encode("close");
    try {
      await this.device.writeCharacteristicWithResponseForService(
        this.service, this.characteristicW, text
      )
    } catch (ex) {
      Alert.alert("Write ERROR")
    }
  }

  // createNewCount = async () => {
  //   const value = this.state.count;
  //   this.setState({count: 0});
  //   try {
  //     // Home: 192.168.1.4
  //     let response = await fetch('http://169.254.165.244:3900/api/counts/', {
  //       method: 'POST',
  //       headers: {
  //         Accept: 'application/json',
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         value: value,
  //       }),
  //     });
  //     let responseJson = await response.json();
  //     return responseJson
  //   } catch (error) {
  //     console.log(error);
  //     this.setState({info: error});
  //   }
  // }

  // updateValue(key, v) {
  //   let count = this.state.count;
  //   count++;
  //   let value = Base64.decode(v);
  //   let values = this.state.values;
  //   values.push("Characteristic: " + key + " " + "Value: " + value + "\n")
  //   this.setState({values: values});
  //   this.setState({count: count});
  // }

  componentWillMount() {
    if (Platform.OS === 'ios') {
      this.manager.onStateChange((state) => { // Wait for BLE stack to init properly
        if (state === 'PoweredOn') {
          this.setState({app_state: "start"}); // Search for devices
        }
      })
    } else {
      //this.app_state = "start";
      this.setState({app_state: "start"});
    }
  }

  scan = () => {
    this.manager.startDeviceScan(null, null, (error, device) => {
      this.setState({info: "Scanning..."})
      console.log(device)

      if (error) {
        this.setState({info: "ERROR: " + error.message})
        return
      }

      if (device.name === 'Adafruit Bluefruit LE') {
        this.setState({info: "Bluefruit LE Found", app_state: "BLE_initialized"})
        this.manager.stopDeviceScan()
        this.device = device;
      }
    });
  }

  connect = device => {
    device.connect()
      .then((device) => {
        this.setState({info: "Discovering services and characteristics", app_state: "BLE_connected"})
        return device.discoverAllServicesAndCharacteristics()/// ????
      })
      .then((device) => {
        this.setState({info: "Setting notifications"})
        return this.setupNotifications(device) //?????????
      })
      .then(() => {
        this.setState({info: "Listening..."});
      })
      .catch((error) => {
        this.setState({info: "ERROR: " + error.message})
      });
  }


  async setupNotifications(device) {
    device.monitorCharacteristicForService(
      this.service, this.characteristicN, (error, characteristic) => {
      if (error) {
        this.setState({info: "ERROR: " + error.message})
        return
      }
      //this.updateValue(characteristic.uuid, characteristic.value)
    })
  }

  render() {
    let lock_image;
    if (!this.state.switch_val)
      lock_image = <Image style={styles.logo} source={require('./unlocked.png')}/>;
    else
      lock_image = <Image style={styles.logo} source={require('./locked.png')}/>;

    return (
      <View style={{flex: 1, flexDirection: 'column'}}>
        <View style={{
          flex: 1,
          backgroundColor: 'white',
          alignItems: 'center',
          justifyContent: 'center'
          }} >
          {/* <Text style={{fontWeight: 'bold', fontSize: 20}}>{this.state.info}</Text>
          <Text style={{fontWeight: 'bold', fontSize: 20}}>{this.state.app_state}</Text> */}
          {(this.state.app_state === "start") && (
            <TouchableOpacity onPress={this.scan}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Scan for Device</Text>
              </View>
            </TouchableOpacity>
          )}
          {(this.state.app_state === "BLE_initialized") && (
            <TouchableOpacity onPress={() => this.connect(this.device)}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Connect</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <View style={{flex: 2, flexDirection: 'row'}}>
          {/* <View style={{
            flex: 1,
            backgroundColor: 'royalblue',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2
          }} >
            <Text style={{fontWeight: 'bold', fontSize: 30}}>Count</Text>
            <Text style={{fontWeight: 'bold', fontSize: 30}}>{this.state.count}</Text>
          </View> */}
          <View style={{
            flex: 1,
            backgroundColor: '#4CC351',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderRadius: 20,
            margin: 20
            }} >
            {/* <Text style={{fontWeight: 'bold', fontSize: 30}}>Door Lock</Text> */}
            {(this.state.app_state === "BLE_connected") && (
              <View style={{flex: 1}}>
                <TouchableOpacity onPress={this.toggleSwitch}>
                {lock_image}
                </TouchableOpacity>
                {/* <Switch
                  onValueChange={this.toggleSwitch}
                  value={this.state.switch_val}
                  style={{marginTop: 10}}
                /> */}
              </View>
            )}
         </View>
        </View>
        <View style={{
          flex: 1,
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* <TouchableOpacity onPress={this.createNewCount}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Create Count</Text>
            </View>
          </TouchableOpacity> */}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 12,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    margin: 10,
    width: 200,
    alignItems: 'center',
    backgroundColor: 'forestgreen',
    borderWidth: 2,
    borderRadius: 20
  },
  buttonText: {
    textAlign: 'center',
    padding: 20,
    color: 'black'
  },
  logo: {
    flex: 1,
    marginTop: 15,
    marginBottom: 15,
    aspectRatio: 1.5, 
    resizeMode: 'contain'
  }
});
