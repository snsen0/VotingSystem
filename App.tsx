import React, { useState, useEffect } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ethers } from 'ethers';
import '@ethersproject/shims';
import 'react-native-get-random-values';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import EncryptedStorage from 'react-native-encrypted-storage';
import Modal from 'react-native-modal';

const Stack = createStackNavigator();

const images = {
  aslan: require("./src/image/1.jpeg"),
  jaguar: require("./src/image/2.jpeg"),
  kaplan: require("./src/image/3.jpeg"),
  kurt: require("./src/image/4.jpeg"),
  leopar: require("./src/image/5.jpeg"),
  sirtlan: require("./src/image/6.jpeg"),
};

export default function App() {
  const [tcKimlik, setTCKimlik] = useState("");
  const [telefon, setTelefon] = useState("");
  const [error, setError] = useState("");
  const [isTCKimlikValid, setIsTCKimlikValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletaddress, setAddress] = useState("");


  const handleGiris = ({ navigation }: { navigation: any }) => {
    if (tcKimlik.trim() === "" || telefon.trim() === "") {
      setError("TC kimlik ve Telefon Numarası zorunludur.");
    } else {
      setError("");
      navigation.navigate("Secim");
      setTCKimlik("");
      setTelefon("");
    }
  };


  const handleTCKimlikChange = (text: string) => {
    if (text.length <= 11) {
      setTCKimlik(text);
      if (text.length === 11) {
        setIsTCKimlikValid(true);
      } else {
        setIsTCKimlikValid(false);
      }
    } else {
      setError("TC Kimlik Numarası 11 haneli olmalıdır.");
    }
  };


interface Provider {
  name: string;
  rpc: string;
}

const providerInfo: { namenet: string; rpcnet: string }[] = [
  {
    namenet: 'Ganache',
    rpcnet: 'http://127.0.0.1:7545',
  },
];

// providers nesnesini bir tür ile belirtiyoruz
type Providers = Record<string, ethers.JsonRpcProvider>;
const providers: Providers = {};

providerInfo.forEach((info) => {
  providers[info.namenet] = new ethers.JsonRpcProvider(info.rpcnet);
});


// Yeni bir Ethereum cüzdanı oluşturmak veya varsa almak için fonksiyon
const createOrRetrieveWallet = (tcKimlik: string) => {
  EncryptedStorage.getItem(`wallet_${tcKimlik}`)
    .then((walletData) => {
      if (walletData) {
        const walletInfo = JSON.parse(walletData);
        console.log('Public Key:', walletInfo.address);
        console.log('Private Key:', walletInfo.pKey);
        console.log('Mnemonic:', walletInfo.mnemonic);
        setTCKimlik(walletInfo.address);
        setTCKimlik(tcKimlik);
        setTCKimlik("");
        setLoading(false);
        setAddress(walletInfo.address);
      } else {
        console.log('Cüzdan bulunamadı. Yeni bir cüzdan oluşturuluyor...');
        const wallet = ethers.Wallet.createRandom();
        const walletInfo = {
          address: wallet.address,
          pKey: wallet.privateKey,
          mnemonic: wallet.mnemonic ? wallet.mnemonic.phrase : 'Mnemonic not available',
        };
        const walletInfoJSON = JSON.stringify(walletInfo);
        console.log(walletData);

        EncryptedStorage.setItem(`wallet_${tcKimlik}`, walletInfoJSON)
          .then(() => {
            console.log('Yeni cüzdan oluşturuldu ve kaydedildi:');
            console.log('Public Key:', walletInfo.address);
            console.log('Private Key:', walletInfo.pKey);
            setTCKimlik(walletInfo.address);
            setTCKimlik(tcKimlik);
            setTCKimlik("");
            setAddress(walletInfo.address);
            if (wallet.mnemonic) {
              console.log('Mnemonic:', wallet.mnemonic.phrase);
            } else {
              console.log('Bu cüzdan için mnemonic mevcut değil.');
            }
            setLoading(false);
          })
          .catch((error) => {
            console.error('Cüzdan kaydedilirken hata oluştu:', error);
          });
      }
    });
};

  const handleTelefonChange = (text: string) => {
    if (text.length <= 11) {
      setTelefon(text);
      if (text.length === 11) {
        setError("");
      }
    } else {
      setError("Telefon Numarası 11 haneli olmalıdır.");
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Giris">
          {({ navigation }: { navigation: any }) => (
            <View style={styles.container}>
              <Text style={styles.text}>Oylama Giriş Ekranı</Text>
              <TextInput
                style={styles.input}
                placeholder="TC Kimlik Numarası"
                onChangeText={handleTCKimlikChange}
                value={tcKimlik}
              />
              <TextInput
                style={styles.input}
                placeholder="Telefon Numarası"
                onChangeText={handleTelefonChange}
                value={telefon}
              />
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <Button
                title="Giriş Yap"
                onPress={() => {
                  if (isTCKimlikValid) {
                    setLoading(true);
                    createOrRetrieveWallet(tcKimlik);
                    handleGiris({ navigation });
                  }
                }}
              />
              <StatusBar
                barStyle="dark-content"
                backgroundColor="white"
                animated={true}
                translucent={false}
              />
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen name="Secim">
          {({ navigation }: { navigation: any }) => (
            <SecimScreen navigation={navigation} images={images} setError={setError} walletAddress={walletaddress}/>
          )}
        </Stack.Screen>
        <Stack.Screen name="Onay">
          {({ navigation }: { navigation: any }) => (
            <OnayScreen navigation={navigation} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      {loading && (
        <View style={styles.activityIndicator}>
          <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
        </View>
    )}
    </NavigationContainer>     
  );
}

function SecimScreen({ navigation, images, setError, walletAddress }: { navigation: any; images: any; setError: any; walletAddress: string }) {
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [truncatedText, setTruncatedText] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);


  useEffect(() => {
    const truncatedAddress = walletAddress.substring(0, 6) + "..." + walletAddress.substring(walletAddress.length - 6);
    setTruncatedText(truncatedAddress);
    console.log(truncatedAddress);
  }, [walletAddress]); 

  const handleAddress = () => {
    setModalVisible(!isModalVisible);
  };

  const animalImages = Object.keys(images).map((animal, index) => (
    <TouchableOpacity
      key={index}
      onPress={() => setSelectedAnimal(animal)}
      style={[
        styles.imageContainer,
        selectedAnimal === animal && styles.selectedImageContainer,
      ]}
    >
      <Image source={images[animal]} style={styles.image} />
      {selectedAnimal === animal && (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  ));

  const handleOyKullan = () => {
    if (selectedAnimal) {
      navigation.navigate("Onay");
    } else {
      setError("Lütfen bir hayvan seçin.");
    }
  };

  return (
    <View style={styles.container}>

      <TouchableOpacity onPress={handleAddress} style={styles.addressButton}>
        <Text style={styles.adressText}>{ truncatedText }</Text>
      </TouchableOpacity>

      <Text style={styles.text}>Seçim Ekranı</Text>
      <View style={styles.imageContainer}>{animalImages}</View>
      <Button title="Oy Kullan" onPress={handleOyKullan} disabled={!selectedAnimal} />

      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalContainerText}>Metamask Cüzdan Adresi:</Text>
          <Text style={styles.modalContainerText}>{walletAddress}</Text>
          <Button title="Kapat" onPress={handleAddress} />
        </View>
      </Modal>


    </View>
  );
}

function OnayScreen({ navigation }: { navigation: any }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate("Giris");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Oy Onay Ekranı</Text>
      <Text style={styles.onayText}>Oyunuz başarılı şekilde kullanıldı.</Text>
      <Text style={styles.onayText}>Teşekkür ederiz.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
    color: "#000",
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    margin: 10,
    padding: 10,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  image: {
    width: 120,
    height: 120,
    margin: 10,
  },
  errorContainer: {
    marginVertical: 10,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  selectedImageContainer: {
    borderColor: "green",
    borderWidth: 2,
  },
  checkmarkContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "green",
    borderRadius: 10,
    padding: 5,
  },
  checkmark: {
    color: "white",
    fontWeight: "bold",
  },
  onayText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
    color: "green",
  },
  activityIndicator:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent background
  }, 
  addressButton: {
    width: 140,
    borderWidth: 2,
    borderColor: '#ffa500',
    padding: 5,
    paddingLeft:13,
    borderRadius: 5,
    marginTop:-50,
    marginBottom:30,
    marginLeft: 15,
    backgroundColor:'#ffebcd',
  },
  adressText: {
    color: 'black', // Beyaz geri dön buton metin rengi
    fontSize: 15,
  },
  modalContainer:{
    width: '100%',
    height: 100,
    backgroundColor:'white',
  },
  modalContainerText:{
    fontSize: 14.7,
    color: "#000",
    marginBottom:10,
  },
});
